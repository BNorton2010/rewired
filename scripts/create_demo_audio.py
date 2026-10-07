"""Rebuild the original, static CC0 ambient samples. Requires ffmpeg, not a paid service."""
from pathlib import Path
import subprocess

destination = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
destination.mkdir(parents=True, exist_ok=True)
for minutes, root in [(3, 130.81), (5, 110), (9, 98)]:
    duration = minutes * 60
    expression = '+'.join(f'{amplitude}*sin(2*PI*{root * ratio}*t+0.15*sin(2*PI*0.07*t))' for ratio, amplitude in [(1, .055), (1.5, .025), (2, .012), (2.5, .008)])
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'aevalsrc={expression}:s=22050:d={duration}', '-af', f'afade=t=in:d=4,afade=t=out:st={duration-4}:d=4', '-c:a', 'libmp3lame', '-b:a', '64k', str(destination / f'ambient-{minutes}m.mp3')], check=True)
    print(f'Created ambient-{minutes}m.mp3 ({duration} seconds)')
