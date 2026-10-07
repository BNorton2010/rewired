export const topics = [
  { id: 'self-trust', label: 'Self-trust', short: 'Self-trust', description: 'Come back to your own knowing.', color: '#E8BE69', icon: 'shield' },
  { id: 'receiving', label: 'Money & receiving', short: 'Receiving', description: 'Make room for what comes to you.', color: '#AD9CF2', icon: 'moon' },
  { id: 'visibility', label: 'Visibility', short: 'Visibility', description: 'Let yourself take up a little space.', color: '#75AEF4', icon: 'sun' },
  { id: 'focus', label: 'Focus', short: 'Focus', description: 'Find one gentle next step.', color: '#6DD9D1', icon: 'target' },
  { id: 'creativity', label: 'Creativity', short: 'Creativity', description: 'Create from curiosity, not pressure.', color: '#C59AF0', icon: 'zap' },
  { id: 'peaceful-ambition', label: 'Peaceful ambition', short: 'Peace & ambition', description: 'Grow without leaving yourself behind.', color: '#82C9BD', icon: 'feather' },
] as const;
export type Topic = typeof topics[number]['id'];
export type SessionLength = 3 | 5 | 9;
export type ArtworkKind = 'sunrise' | 'orbit' | 'moon' | 'nebula' | 'ocean';
export type Lesson = {
  id: string; title: string; topic: Topic; minutes: SessionLength; artwork: ArtworkKind;
  description: string; intention: string; transcript: string[]; quick?: boolean;
};
export const lessons: Lesson[] = [
  { id: 'be-seen', title: 'You can be seen and still be safe', topic: 'visibility', minutes: 9, artwork: 'sunrise',
    description: 'A little space to soften the pressure of showing up. Practice choosing one honest, manageable act of visibility.',
    intention: 'One small act of courage today.',
    transcript: ['Let your attention settle on the support beneath you. Let your breathing find its own pace.', 'Notice what comes up when you imagine sharing your work. You do not have to make the feeling disappear to take a small step.', 'Ask yourself: what would an honest, manageable act of visibility look like today? It might be a message, a draft, or one sentence.', 'You can choose your boundaries and your pace. When you are ready, return to the room and take the step that feels right for you.'] },
  { id: 'trust-again', title: 'Trust yourself again', topic: 'self-trust', minutes: 5, artwork: 'orbit',
    description: 'Turn down the outside noise and reconnect with a decision that belongs to you.', intention: 'Your own voice deserves room.',
    transcript: ['Pause and notice where you are. There is no perfect way to do this practice.', 'Think of one small decision. Notice the difference between what you want and what you think you should want.', 'What information do you need? What can you decide with what you already know? Give yourself permission to be a learner.', 'Choose one next step. Self-trust can be practiced in ordinary decisions, and you are allowed to revise them.'] },
  { id: 'receiving', title: 'Make peace with receiving', topic: 'receiving', minutes: 9, artwork: 'moon',
    description: 'Explore what it feels like to accept support, appreciation, or a fair exchange.', intention: 'You can let support reach you.',
    transcript: ['Rest your hands wherever they feel comfortable. Notice one thing that is supporting you right now.', 'Recall a moment when receiving something felt complicated. There is no need to judge that response.', 'Consider a small offer you could accept: help, a compliment, or a fair payment. You can receive without promising more than you have to give.', 'Practice a simple thank you. Notice what feels possible, and carry that curiosity into your day.'] },
  { id: 'one-thing', title: 'Return to one thing', topic: 'focus', minutes: 5, artwork: 'ocean',
    description: 'Set the open tabs down for a moment. Find a clear and kind place to begin.', intention: 'Less noise. One next step.',
    transcript: ['Notice your surroundings. Let your eyes rest on something still.', 'Name the task that matters most in this moment. Everything else can wait for the length of this practice.', 'Make the first step small enough to start: open a page, write a line, clear a space.', 'Choose a time to return to it. Focus can be gentle, and a beginning can be enough.'] },
  { id: 'without-force', title: 'Create without force', topic: 'creativity', minutes: 9, artwork: 'nebula',
    description: 'Make room for a rough first thought, an experiment, or a new direction.', intention: 'Follow the thread of curiosity.',
    transcript: ['Take a moment away from the expectation to produce something polished.', 'What has caught your curiosity lately? A color, a question, an unfinished thought?', 'Imagine making something small with no need to show it to anyone. Let it be a sketch rather than a statement.', 'Choose one playful experiment. You are allowed to begin before you know where it leads.'] },
  { id: 'peaceful-growth', title: 'Ambition, with room to breathe', topic: 'peaceful-ambition', minutes: 5, artwork: 'sunrise',
    description: 'Reconnect with what you are building and the life you want to have while building it.', intention: 'Your pace can belong to you.',
    transcript: ['Allow a pause between doing and deciding what comes next.', 'Think about what you are working toward. What part of it matters to you, apart from how it looks to others?', 'Name a boundary that would help you keep going with more care. Rest and support can be part of the plan.', 'Take one useful step at a pace you can sustain today. There is room to revisit tomorrow.'] },
  { id: 'before-post', title: 'Before you post', topic: 'visibility', minutes: 3, artwork: 'ocean', quick: true,
    description: 'A brief pause before you press publish. Come back to your reason for sharing.', intention: 'Share one honest thing.',
    transcript: ['Pause before you press publish. Feel the ground beneath you.', 'Ask: what do I hope this offers someone? You can share something useful without sharing everything.', 'Read it once with kindness. Check your boundaries. When you feel ready, choose your next step.'] },
  { id: 'doubt', title: 'When doubt gets loud', topic: 'self-trust', minutes: 3, artwork: 'nebula', quick: true,
    description: 'Give a doubtful thought a little breathing room, without asking it to disappear.', intention: 'A thought is a place to begin, not a verdict.',
    transcript: ['Notice the thought that is asking for your attention. Name it gently: I am having a doubtful thought.', 'What facts do you have? What remains unknown? You can hold uncertainty without deciding everything now.', 'Choose one small action that could give you useful information. Return to your day when you feel ready.'] },
];
export const getLesson = (id?: string | null) => lessons.find(lesson => lesson.id === id);
export const topicFor = (id: Topic) => topics.find(topic => topic.id === id)!;
