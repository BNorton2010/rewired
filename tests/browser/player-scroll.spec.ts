import { test, expect, type CDPSession } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 390, height: 667 } });

async function swipe(session: CDPSession, x: number, fromY: number, toY: number) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
  for (let step = 1; step <= 10; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: fromY + (toY - fromY) * step / 10 }] });
    await new Promise(resolve => setTimeout(resolve, 24));
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('player touch scrolling survives seek cancellation and works over foreground controls', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByTestId('finish-onboarding').click();
  await page.getByRole('button', { name: 'Start listening' }).click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Pause practice');
  await page.getByRole('button', { name: 'Reflective text', exact: true }).click();
  const scroll = page.getByTestId('player-scroll');
  const scrollTop = () => scroll.evaluate(node => node.scrollTop);
  await expect.poll(() => scroll.evaluate(node => node.scrollHeight > node.clientHeight + 200)).toBe(true);
  const session = await context.newCDPSession(page);

  await scroll.evaluate(node => { node.scrollTop = 0; });
  await swipe(session, 195, 450, 200);
  await expect.poll(scrollTop).toBeGreaterThan(100);

  // A vertical gesture beginning on the seek track must scroll the page. The
  // browser cancels range tracking when it takes the pan; no stale drag lock
  // may survive that cancellation.
  const slider = page.getByRole('slider', { name: 'Seek audio' });
  await slider.scrollIntoViewIfNeeded();
  const bounds = (await slider.boundingBox())!;
  const before = await scrollTop();
  expect(await slider.evaluate(node => getComputedStyle(node).touchAction)).toBe('pan-y');
  await swipe(session, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, Math.max(50, bounds.y - 180));
  await expect.poll(scrollTop).toBeGreaterThan(before + 50);
  expect(await scroll.evaluate(node => getComputedStyle(node).overflowY)).not.toBe('hidden');

  // A real horizontal touch drag still seeks after that cancelled vertical pan.
  await slider.scrollIntoViewIfNeeded();
  const track = (await slider.boundingBox())!;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: track.x + track.width * .25, y: track.y + track.height / 2 }] });
  for (let step = 1; step <= 8; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: track.x + track.width * (.25 + .5 * step / 8), y: track.y + track.height / 2 }] });
    await new Promise(resolve => setTimeout(resolve, 24));
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const duration = Number(await slider.getAttribute('max'));
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(duration * .6);
  // Keyboard and assistive seeking continue to work as well.
  await slider.fill('30');
  await expect(page.getByTestId('audio-position')).toHaveText('0:30');
  await page.getByTestId('player-toggle').click();
  await expect(page.getByTestId('player-toggle')).toHaveAttribute('aria-label', 'Play practice');
  const control = (await page.getByTestId('player-toggle').boundingBox())!;
  const afterSeek = await scrollTop();
  await swipe(session, control.x + control.width / 2, control.y + control.height / 2, Math.max(50, control.y - 140));
  await expect.poll(scrollTop).toBeGreaterThan(afterSeek + 50);
  expect(errors).toEqual([]);
});
