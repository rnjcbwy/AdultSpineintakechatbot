// ============================================================================
// Patient-Reported Outcome Measures (PROMs) Definitions
// Conditionally applied based on patient's chief complaint and HPI
// ============================================================================

/**
 * Oswestry Disability Index (ODI) — Lumbar spine
 * 10 sections, 6 options each (scored 0–5).
 * Total = (sum / (5 × sections answered)) × 100 → 0–100%
 */
export const ODI = {
  id: 'odi',
  name: 'Oswestry Disability Index (ODI)',
  shortName: 'ODI',
  description: 'This questionnaire helps us understand how your low back pain affects your daily activities.',
  sections: [
    {
      id: 'pain_intensity',
      title: 'Pain Intensity',
      options: [
        { score: 0, label: 'I have no pain at the moment' },
        { score: 1, label: 'The pain is very mild at the moment' },
        { score: 2, label: 'The pain is moderate at the moment' },
        { score: 3, label: 'The pain is fairly severe at the moment' },
        { score: 4, label: 'The pain is very severe at the moment' },
        { score: 5, label: 'The pain is the worst imaginable at the moment' },
      ],
    },
    {
      id: 'personal_care',
      title: 'Personal Care (Washing, Dressing, etc.)',
      options: [
        { score: 0, label: 'I can look after myself normally without causing extra pain' },
        { score: 1, label: 'I can look after myself normally but it causes extra pain' },
        { score: 2, label: 'It is painful to look after myself and I am slow and careful' },
        { score: 3, label: 'I need some help but can manage most of my personal care' },
        { score: 4, label: 'I need help every day in most aspects of self-care' },
        { score: 5, label: 'I do not get dressed, I wash with difficulty, and stay in bed' },
      ],
    },
    {
      id: 'lifting',
      title: 'Lifting',
      options: [
        { score: 0, label: 'I can lift heavy weights without extra pain' },
        { score: 1, label: 'I can lift heavy weights but it gives me extra pain' },
        { score: 2, label: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently placed' },
        { score: 3, label: 'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if they are conveniently positioned' },
        { score: 4, label: 'I can only lift very light weights' },
        { score: 5, label: 'I cannot lift or carry anything at all' },
      ],
    },
    {
      id: 'walking',
      title: 'Walking',
      options: [
        { score: 0, label: 'Pain does not prevent me from walking any distance' },
        { score: 1, label: 'Pain prevents me from walking more than 1 mile' },
        { score: 2, label: 'Pain prevents me from walking more than 1/2 mile' },
        { score: 3, label: 'Pain prevents me from walking more than 100 yards' },
        { score: 4, label: 'I can only walk using a cane or crutches' },
        { score: 5, label: 'I am in bed most of the time' },
      ],
    },
    {
      id: 'sitting',
      title: 'Sitting',
      options: [
        { score: 0, label: 'I can sit in any chair as long as I like' },
        { score: 1, label: 'I can only sit in my favorite chair as long as I like' },
        { score: 2, label: 'Pain prevents me from sitting for more than 1 hour' },
        { score: 3, label: 'Pain prevents me from sitting for more than 30 minutes' },
        { score: 4, label: 'Pain prevents me from sitting for more than 10 minutes' },
        { score: 5, label: 'Pain prevents me from sitting at all' },
      ],
    },
    {
      id: 'standing',
      title: 'Standing',
      options: [
        { score: 0, label: 'I can stand as long as I want without extra pain' },
        { score: 1, label: 'I can stand as long as I want but it gives me extra pain' },
        { score: 2, label: 'Pain prevents me from standing for more than 1 hour' },
        { score: 3, label: 'Pain prevents me from standing for more than 30 minutes' },
        { score: 4, label: 'Pain prevents me from standing for more than 10 minutes' },
        { score: 5, label: 'Pain prevents me from standing at all' },
      ],
    },
    {
      id: 'sleeping',
      title: 'Sleeping',
      options: [
        { score: 0, label: 'My sleep is never disturbed by pain' },
        { score: 1, label: 'My sleep is occasionally disturbed by pain' },
        { score: 2, label: 'Because of pain I have less than 6 hours of sleep' },
        { score: 3, label: 'Because of pain I have less than 4 hours of sleep' },
        { score: 4, label: 'Because of pain I have less than 2 hours of sleep' },
        { score: 5, label: 'Pain prevents me from sleeping at all' },
      ],
    },
    {
      id: 'sex_life',
      title: 'Sex Life (if applicable)',
      optional: true,
      options: [
        { score: 0, label: 'My sex life is normal and causes no extra pain' },
        { score: 1, label: 'My sex life is normal but causes some extra pain' },
        { score: 2, label: 'My sex life is nearly normal but is very painful' },
        { score: 3, label: 'My sex life is severely restricted by pain' },
        { score: 4, label: 'My sex life is nearly absent because of pain' },
        { score: 5, label: 'Pain prevents any sex life at all' },
      ],
    },
    {
      id: 'social_life',
      title: 'Social Life',
      options: [
        { score: 0, label: 'My social life is normal and gives me no extra pain' },
        { score: 1, label: 'My social life is normal but increases the degree of pain' },
        { score: 2, label: 'Pain has no significant effect on my social life apart from limiting my more energetic interests' },
        { score: 3, label: 'Pain has restricted my social life and I do not go out as often' },
        { score: 4, label: 'Pain has restricted my social life to my home' },
        { score: 5, label: 'I have no social life because of pain' },
      ],
    },
    {
      id: 'traveling',
      title: 'Traveling',
      options: [
        { score: 0, label: 'I can travel anywhere without pain' },
        { score: 1, label: 'I can travel anywhere but it gives me extra pain' },
        { score: 2, label: 'Pain is bad but I manage journeys over 2 hours' },
        { score: 3, label: 'Pain restricts me to journeys of less than 1 hour' },
        { score: 4, label: 'Pain restricts me to short necessary journeys under 30 minutes' },
        { score: 5, label: 'Pain prevents me from traveling except to receive treatment' },
      ],
    },
  ],
};


/**
 * Neck Disability Index (NDI) — Cervical spine
 * 10 sections, 6 options each (scored 0–5).
 * Total = (sum / (5 × sections answered)) × 100 → 0–100%
 */
export const NDI = {
  id: 'ndi',
  name: 'Neck Disability Index (NDI)',
  shortName: 'NDI',
  description: 'This questionnaire helps us understand how your neck pain affects your daily activities.',
  sections: [
    {
      id: 'pain_intensity',
      title: 'Pain Intensity',
      options: [
        { score: 0, label: 'I have no pain at the moment' },
        { score: 1, label: 'The pain is very mild at the moment' },
        { score: 2, label: 'The pain is moderate at the moment' },
        { score: 3, label: 'The pain is fairly severe at the moment' },
        { score: 4, label: 'The pain is very severe at the moment' },
        { score: 5, label: 'The pain is the worst imaginable at the moment' },
      ],
    },
    {
      id: 'personal_care',
      title: 'Personal Care (Washing, Dressing, etc.)',
      options: [
        { score: 0, label: 'I can look after myself normally without causing extra pain' },
        { score: 1, label: 'I can look after myself normally but it causes extra pain' },
        { score: 2, label: 'It is painful to look after myself and I am slow and careful' },
        { score: 3, label: 'I need some help but can manage most of my personal care' },
        { score: 4, label: 'I need help every day in most aspects of self-care' },
        { score: 5, label: 'I do not get dressed, I wash with difficulty, and stay in bed' },
      ],
    },
    {
      id: 'lifting',
      title: 'Lifting',
      options: [
        { score: 0, label: 'I can lift heavy weights without extra pain' },
        { score: 1, label: 'I can lift heavy weights but it gives me extra pain' },
        { score: 2, label: 'Pain prevents me from lifting heavy weights off the floor, but I can if they are conveniently placed' },
        { score: 3, label: 'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if conveniently positioned' },
        { score: 4, label: 'I can only lift very light weights' },
        { score: 5, label: 'I cannot lift or carry anything at all' },
      ],
    },
    {
      id: 'reading',
      title: 'Reading',
      options: [
        { score: 0, label: 'I can read as much as I want to with no pain in my neck' },
        { score: 1, label: 'I can read as much as I want to with slight pain in my neck' },
        { score: 2, label: 'I can read as much as I want with moderate pain in my neck' },
        { score: 3, label: 'I can\'t read as much as I want because of moderate pain in my neck' },
        { score: 4, label: 'I can hardly read at all because of severe pain in my neck' },
        { score: 5, label: 'I cannot read at all' },
      ],
    },
    {
      id: 'headaches',
      title: 'Headaches',
      options: [
        { score: 0, label: 'I have no headaches at all' },
        { score: 1, label: 'I have slight headaches which come infrequently' },
        { score: 2, label: 'I have moderate headaches which come infrequently' },
        { score: 3, label: 'I have moderate headaches which come frequently' },
        { score: 4, label: 'I have severe headaches which come frequently' },
        { score: 5, label: 'I have headaches almost all the time' },
      ],
    },
    {
      id: 'concentration',
      title: 'Concentration',
      options: [
        { score: 0, label: 'I can concentrate fully when I want to with no difficulty' },
        { score: 1, label: 'I can concentrate fully when I want to with slight difficulty' },
        { score: 2, label: 'I have a fair degree of difficulty in concentrating when I want to' },
        { score: 3, label: 'I have a lot of difficulty in concentrating when I want to' },
        { score: 4, label: 'I have a great deal of difficulty in concentrating when I want to' },
        { score: 5, label: 'I cannot concentrate at all' },
      ],
    },
    {
      id: 'work',
      title: 'Work',
      options: [
        { score: 0, label: 'I can do as much work as I want to' },
        { score: 1, label: 'I can only do my usual work, but no more' },
        { score: 2, label: 'I can do most of my usual work, but no more' },
        { score: 3, label: 'I cannot do my usual work' },
        { score: 4, label: 'I can hardly do any work at all' },
        { score: 5, label: 'I can\'t do any work at all' },
      ],
    },
    {
      id: 'driving',
      title: 'Driving',
      optional: true,
      options: [
        { score: 0, label: 'I can drive my car without any neck pain' },
        { score: 1, label: 'I can drive my car as long as I want with slight pain in my neck' },
        { score: 2, label: 'I can drive my car as long as I want with moderate pain in my neck' },
        { score: 3, label: 'I can\'t drive my car as long as I want because of moderate pain in my neck' },
        { score: 4, label: 'I can hardly drive at all because of severe pain in my neck' },
        { score: 5, label: 'I can\'t drive my car at all' },
      ],
    },
    {
      id: 'sleeping',
      title: 'Sleeping',
      options: [
        { score: 0, label: 'I have no trouble sleeping' },
        { score: 1, label: 'My sleep is slightly disturbed (less than 1 hour sleepless)' },
        { score: 2, label: 'My sleep is mildly disturbed (1–2 hours sleepless)' },
        { score: 3, label: 'My sleep is moderately disturbed (2–3 hours sleepless)' },
        { score: 4, label: 'My sleep is greatly disturbed (3–5 hours sleepless)' },
        { score: 5, label: 'My sleep is completely disturbed (5–7 hours sleepless)' },
      ],
    },
    {
      id: 'recreation',
      title: 'Recreation',
      options: [
        { score: 0, label: 'I am able to engage in all my recreation activities with no neck pain at all' },
        { score: 1, label: 'I am able to engage in all my recreation activities with some pain in my neck' },
        { score: 2, label: 'I am able to engage in most, but not all, of my usual recreation activities because of pain in my neck' },
        { score: 3, label: 'I am able to engage in a few of my usual recreation activities because of pain in my neck' },
        { score: 4, label: 'I can hardly do any recreation activities because of pain in my neck' },
        { score: 5, label: 'I can\'t do any recreation activities at all' },
      ],
    },
  ],
};


/**
 * Modified Japanese Orthopedic Association (mJOA) — Cervical myelopathy
 * 4 categories. Total 0–18, higher = better (no dysfunction).
 */
export const MJOA = {
  id: 'mjoa',
  name: 'Modified Japanese Orthopedic Association Score (mJOA)',
  shortName: 'mJOA',
  description: 'This questionnaire evaluates how well your arms, legs, and coordination are functioning. Please select the statement that best describes you right now.',
  sections: [
    {
      id: 'upper_extremity_motor',
      title: 'Upper Extremity Motor Function',
      subtitle: 'How well can you use your hands?',
      options: [
        { score: 5, label: 'I have no difficulty with hand function — my writing, buttoning, and eating are normal' },
        { score: 4, label: 'I have slight difficulty with buttons or fine hand movements, but can do most things' },
        { score: 3, label: 'I have noticeable difficulty with buttons, writing, or handling small objects' },
        { score: 2, label: 'I can move my hands but cannot button my shirt or handle chopsticks/utensils well' },
        { score: 1, label: 'I can move my hands but cannot feed myself with a spoon' },
        { score: 0, label: 'I am unable to move my hands' },
      ],
    },
    {
      id: 'lower_extremity_motor',
      title: 'Lower Extremity Motor Function',
      subtitle: 'How well can you walk?',
      options: [
        { score: 7, label: 'I walk normally with no balance or coordination issues' },
        { score: 6, label: 'I walk on my own but notice mild balance or coordination issues' },
        { score: 5, label: 'I can walk on my own including stairs, but I notice moderate instability' },
        { score: 4, label: 'I can walk on flat ground on my own but need a handrail for stairs' },
        { score: 3, label: 'I need a cane, walker, or someone to help me walk' },
        { score: 2, label: 'I can move my legs but I am unable to walk' },
        { score: 1, label: 'I am unable to move my legs but have some sensation' },
        { score: 0, label: 'I am unable to move my legs and have no sensation' },
      ],
    },
    {
      id: 'upper_extremity_sensory',
      title: 'Upper Extremity Sensation',
      subtitle: 'How is the feeling in your hands and arms?',
      options: [
        { score: 3, label: 'I have completely normal sensation in my hands and arms' },
        { score: 2, label: 'I have mild numbness or tingling in my hands or arms' },
        { score: 1, label: 'I have significant numbness or pain in my hands or arms' },
        { score: 0, label: 'I have complete loss of feeling in my hands' },
      ],
    },
    {
      id: 'sphincter',
      title: 'Bladder Function',
      subtitle: 'How is your urinary control?',
      options: [
        { score: 3, label: 'I have completely normal bladder function' },
        { score: 2, label: 'I have mild difficulty — slight urgency or frequency' },
        { score: 1, label: 'I have significant difficulty — I strain or have retention issues' },
        { score: 0, label: 'I am unable to control my bladder' },
      ],
    },
  ],
};


/**
 * SRS-22r (Scoliosis Research Society-22 Revised) — Spinal deformity
 * 22 questions across 5 domains, each scored 1–5.
 * Domain score = mean of domain questions. Total = mean of first 4 domains.
 */
export const SRS22R = {
  id: 'srs22r',
  name: 'Scoliosis Research Society Questionnaire (SRS-22r)',
  shortName: 'SRS-22r',
  description: 'This questionnaire helps us understand how your spinal condition affects your daily life, appearance, and well-being.',
  domains: [
    { id: 'function', name: 'Function/Activity', questionIds: [5, 9, 12, 15, 18] },
    { id: 'pain', name: 'Pain', questionIds: [1, 2, 8, 11, 17] },
    { id: 'self_image', name: 'Self-Image/Appearance', questionIds: [4, 6, 10, 14, 19] },
    { id: 'mental_health', name: 'Mental Health', questionIds: [3, 7, 13, 16, 20] },
    { id: 'satisfaction', name: 'Satisfaction with Management', questionIds: [21, 22] },
  ],
  questions: [
    // 1 – Pain
    { id: 1, domain: 'pain', text: 'Which best describes your pain over the past 6 months?',
      options: [
        { score: 5, label: 'None' },
        { score: 4, label: 'Mild' },
        { score: 3, label: 'Moderate' },
        { score: 2, label: 'Moderate to severe' },
        { score: 1, label: 'Severe' },
      ],
    },
    // 2 – Pain
    { id: 2, domain: 'pain', text: 'Over the past 6 months, how many months have you had back pain?',
      options: [
        { score: 5, label: '0 months' },
        { score: 4, label: '1 month' },
        { score: 3, label: '2–3 months' },
        { score: 2, label: '4–5 months' },
        { score: 1, label: '6 months' },
      ],
    },
    // 3 – Mental health
    { id: 3, domain: 'mental_health', text: 'During the past 6 months, have you felt so down in the dumps that nothing could cheer you up?',
      options: [
        { score: 5, label: 'Never' },
        { score: 4, label: 'Rarely' },
        { score: 3, label: 'Sometimes' },
        { score: 2, label: 'Often' },
        { score: 1, label: 'Very often' },
      ],
    },
    // 4 – Self-image
    { id: 4, domain: 'self_image', text: 'Do you feel that your spinal condition limits your daily activities?',
      options: [
        { score: 5, label: 'Not at all' },
        { score: 4, label: 'Slightly' },
        { score: 3, label: 'Moderately' },
        { score: 2, label: 'Quite a bit' },
        { score: 1, label: 'Very much' },
      ],
    },
    // 5 – Function
    { id: 5, domain: 'function', text: 'What is your current level of activity?',
      options: [
        { score: 5, label: 'Full activities without restriction' },
        { score: 4, label: 'Full activities with mild restrictions' },
        { score: 3, label: 'Light activities and sports, moderate restrictions' },
        { score: 2, label: 'Unable to do most activities' },
        { score: 1, label: 'Completely disabled, bedridden' },
      ],
    },
    // 6 – Self-image
    { id: 6, domain: 'self_image', text: 'How do you look in clothes?',
      options: [
        { score: 5, label: 'Very good' },
        { score: 4, label: 'Good' },
        { score: 3, label: 'Fair' },
        { score: 2, label: 'Poor' },
        { score: 1, label: 'Very poor' },
      ],
    },
    // 7 – Mental health
    { id: 7, domain: 'mental_health', text: 'In the past 6 months, have you been a happy person?',
      options: [
        { score: 5, label: 'All of the time' },
        { score: 4, label: 'Most of the time' },
        { score: 3, label: 'Some of the time' },
        { score: 2, label: 'A little of the time' },
        { score: 1, label: 'None of the time' },
      ],
    },
    // 8 – Pain
    { id: 8, domain: 'pain', text: 'Do you experience back pain at rest?',
      options: [
        { score: 5, label: 'Never' },
        { score: 4, label: 'Rarely' },
        { score: 3, label: 'Sometimes' },
        { score: 2, label: 'Often' },
        { score: 1, label: 'Very often' },
      ],
    },
    // 9 – Function
    { id: 9, domain: 'function', text: 'What is your current level of work/school activity?',
      options: [
        { score: 5, label: 'Full-time work/school, no restrictions' },
        { score: 4, label: 'Full-time work/school, with mild restrictions' },
        { score: 3, label: 'Part-time, or full-time with significant restrictions' },
        { score: 2, label: 'Severely limited — unable to work/attend school' },
        { score: 1, label: 'Completely disabled' },
      ],
    },
    // 10 – Self-image
    { id: 10, domain: 'self_image', text: 'How do you feel about the appearance of your trunk/torso (the area of your body excluding arms, legs, and head)?',
      options: [
        { score: 5, label: 'Very satisfied' },
        { score: 4, label: 'Satisfied' },
        { score: 3, label: 'Neither satisfied nor dissatisfied' },
        { score: 2, label: 'Dissatisfied' },
        { score: 1, label: 'Very dissatisfied' },
      ],
    },
    // 11 – Pain
    { id: 11, domain: 'pain', text: 'Have you taken any pain medications in the past month for your back?',
      options: [
        { score: 5, label: 'None' },
        { score: 4, label: '1 week or less of non-narcotic medications' },
        { score: 3, label: 'More than 1 week of non-narcotics' },
        { score: 2, label: '1 week or less of narcotic (opioid) medications' },
        { score: 1, label: 'More than 1 week of narcotic (opioid) medications' },
      ],
    },
    // 12 – Function
    { id: 12, domain: 'function', text: 'Does your back condition limit your ability to do things around the house?',
      options: [
        { score: 5, label: 'Not at all' },
        { score: 4, label: 'Slightly' },
        { score: 3, label: 'Moderately' },
        { score: 2, label: 'Quite a bit' },
        { score: 1, label: 'Very much' },
      ],
    },
    // 13 – Mental health
    { id: 13, domain: 'mental_health', text: 'Have you felt calm and peaceful in the past 6 months?',
      options: [
        { score: 5, label: 'All of the time' },
        { score: 4, label: 'Most of the time' },
        { score: 3, label: 'Some of the time' },
        { score: 2, label: 'A little of the time' },
        { score: 1, label: 'None of the time' },
      ],
    },
    // 14 – Self-image
    { id: 14, domain: 'self_image', text: 'Do you feel your spinal condition affects your body attractiveness?',
      options: [
        { score: 5, label: 'Not at all' },
        { score: 4, label: 'Slightly' },
        { score: 3, label: 'Moderately' },
        { score: 2, label: 'Quite a bit' },
        { score: 1, label: 'Very much' },
      ],
    },
    // 15 – Function
    { id: 15, domain: 'function', text: 'Are you and/or your family experiencing financial difficulties because of your back?',
      options: [
        { score: 5, label: 'Not at all' },
        { score: 4, label: 'Slightly' },
        { score: 3, label: 'Moderately' },
        { score: 2, label: 'Quite a bit' },
        { score: 1, label: 'Very much' },
      ],
    },
    // 16 – Mental health
    { id: 16, domain: 'mental_health', text: 'Have you been downhearted and blue in the past 6 months?',
      options: [
        { score: 5, label: 'Never' },
        { score: 4, label: 'Rarely' },
        { score: 3, label: 'Sometimes' },
        { score: 2, label: 'Often' },
        { score: 1, label: 'Very often' },
      ],
    },
    // 17 – Pain
    { id: 17, domain: 'pain', text: 'In the past 6 months, how often has your back pain been at rest?',
      options: [
        { score: 5, label: 'Never' },
        { score: 4, label: 'Rarely' },
        { score: 3, label: 'Sometimes' },
        { score: 2, label: 'Often' },
        { score: 1, label: 'Always' },
      ],
    },
    // 18 – Function
    { id: 18, domain: 'function', text: 'In the past 3 months, how many days have you taken off from work/school because of back pain?',
      options: [
        { score: 5, label: '0 days' },
        { score: 4, label: '1–3 days' },
        { score: 3, label: '4–7 days' },
        { score: 2, label: '8–14 days' },
        { score: 1, label: 'More than 14 days' },
      ],
    },
    // 19 – Self-image
    { id: 19, domain: 'self_image', text: 'If you had to spend the rest of your life with your back as it is right now, how would you feel?',
      options: [
        { score: 5, label: 'Very happy' },
        { score: 4, label: 'Somewhat happy' },
        { score: 3, label: 'Neither happy nor unhappy' },
        { score: 2, label: 'Somewhat unhappy' },
        { score: 1, label: 'Very unhappy' },
      ],
    },
    // 20 – Mental health
    { id: 20, domain: 'mental_health', text: 'Do you feel that your condition affects personal relationships?',
      options: [
        { score: 5, label: 'Not at all' },
        { score: 4, label: 'Slightly' },
        { score: 3, label: 'Moderately' },
        { score: 2, label: 'Quite a bit' },
        { score: 1, label: 'Very much' },
      ],
    },
    // 21 – Satisfaction
    { id: 21, domain: 'satisfaction', text: 'Are you satisfied with the results of your back management to date?',
      options: [
        { score: 5, label: 'Very satisfied' },
        { score: 4, label: 'Satisfied' },
        { score: 3, label: 'Neither satisfied nor dissatisfied' },
        { score: 2, label: 'Dissatisfied' },
        { score: 1, label: 'Very dissatisfied' },
      ],
    },
    // 22 – Satisfaction
    { id: 22, domain: 'satisfaction', text: 'Would you have the same management again if you had the same condition?',
      options: [
        { score: 5, label: 'Definitely yes' },
        { score: 4, label: 'Probably yes' },
        { score: 3, label: 'Not sure' },
        { score: 2, label: 'Probably not' },
        { score: 1, label: 'Definitely not' },
      ],
    },
  ],
};


// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score ODI or NDI (identical scoring method).
 * @param {Object} answers — { sectionId: score (0–5) }
 * @param {Object} questionnaire — ODI or NDI definition
 * @returns {{ rawScore, percentage, sectionsAnswered, interpretation }}
 */
export function scoreOdiNdi(answers, questionnaire) {
  const answered = Object.entries(answers).filter(([, v]) => v !== null && v !== undefined);
  if (answered.length === 0) return null;

  const rawScore = answered.reduce((sum, [, v]) => sum + v, 0);
  const maxPossible = answered.length * 5;
  const percentage = Math.round((rawScore / maxPossible) * 100);

  let interpretation;
  if (percentage <= 20) interpretation = 'Minimal disability';
  else if (percentage <= 40) interpretation = 'Moderate disability';
  else if (percentage <= 60) interpretation = 'Severe disability';
  else if (percentage <= 80) interpretation = 'Crippled';
  else interpretation = 'Bed-bound or exaggerating symptoms';

  return {
    rawScore,
    maxPossible,
    percentage,
    sectionsAnswered: answered.length,
    interpretation,
  };
}


/**
 * Score mJOA.
 * @param {Object} answers — { sectionId: score }
 * @returns {{ totalScore, maxScore, interpretation }}
 */
export function scoreMJOA(answers) {
  const answered = Object.entries(answers).filter(([, v]) => v !== null && v !== undefined);
  if (answered.length === 0) return null;

  const totalScore = answered.reduce((sum, [, v]) => sum + v, 0);
  const maxScore = 18;

  let interpretation;
  if (totalScore >= 18) interpretation = 'No myelopathy';
  else if (totalScore >= 15) interpretation = 'Mild myelopathy';
  else if (totalScore >= 12) interpretation = 'Moderate myelopathy';
  else interpretation = 'Severe myelopathy';

  return { totalScore, maxScore, interpretation };
}


/**
 * Score SRS-22r.
 * @param {Object} answers — { questionId: score (1–5) }
 * @returns {{ domainScores, totalScore, interpretation }}
 */
export function scoreSRS22R(answers) {
  const answered = Object.entries(answers).filter(([, v]) => v !== null && v !== undefined);
  if (answered.length === 0) return null;

  const domainScores = {};
  for (const domain of SRS22R.domains) {
    const domainAnswers = domain.questionIds
      .map((qId) => answers[qId])
      .filter((v) => v !== null && v !== undefined);
    if (domainAnswers.length > 0) {
      domainScores[domain.id] = {
        name: domain.name,
        score: parseFloat((domainAnswers.reduce((a, b) => a + b, 0) / domainAnswers.length).toFixed(2)),
        questionsAnswered: domainAnswers.length,
        questionsTotal: domain.questionIds.length,
      };
    }
  }

  // Total excluding satisfaction
  const mainDomains = ['function', 'pain', 'self_image', 'mental_health'];
  const mainScores = mainDomains
    .map((d) => domainScores[d]?.score)
    .filter((v) => v !== undefined);
  const totalScore = mainScores.length > 0
    ? parseFloat((mainScores.reduce((a, b) => a + b, 0) / mainScores.length).toFixed(2))
    : null;

  return { domainScores, totalScore };
}


// ============================================================================
// CONDITIONAL LOGIC — Determine which PROMs to show
// ============================================================================

/**
 * Determines which questionnaires are applicable based on intake data.
 * @param {Object} intakeData — full intake store data
 * @returns {string[]} — array of questionnaire IDs to show
 */
export function getApplicableQuestionnaires(intakeData) {
  const questionnaires = [];
  const regions = intakeData.chiefComplaint?.symptomRegions || [];
  const symptoms = intakeData.hpiData?.symptoms || {};

  // Lumbar complaints → ODI
  const lumbarRegions = ['low-back', 'right-leg', 'left-leg', 'walking-difficulty'];
  if (regions.some((r) => lumbarRegions.includes(r))) {
    questionnaires.push('odi');
  }

  // Cervical complaints → NDI
  const cervicalRegions = ['neck', 'right-arm', 'left-arm'];
  if (regions.some((r) => cervicalRegions.includes(r))) {
    questionnaires.push('ndi');
  }

  // Myelopathic symptoms → mJOA
  const hasMyelopathy = regions.includes('balance') ||
    regions.includes('hand-clumsiness') ||
    Object.values(symptoms).some((s) =>
      s.handDexterity === true ||
      s.droppingObjects === true ||
      s.gaitChanges === true ||
      s.lhermittes === true
    );
  if (hasMyelopathy) {
    questionnaires.push('mjoa');
  }

  // Deformity/scoliosis concern → SRS-22r
  if (regions.includes('posture-deformity') || intakeData.chiefComplaint?.hasDeformityConcern) {
    questionnaires.push('srs22r');
  }

  return questionnaires;
}
