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
  const overall = intakeData.hpiData?.overall || {};
  const hasMyelopathy = regions.includes('balance') ||
    regions.includes('hand-clumsiness') ||
    overall.handDexterity === true || overall.droppingObjects === true || overall.gaitChanges === true || overall.lhermittes === true ||
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


// ============================================================================
// THE SHAPE EVERY SERVICE SHARES
//
// components/steps/PROMs.js reads these through useService().questionnaires
// and never names an instrument; the ortho module exports the same names.
// ============================================================================

/** Every instrument this service can offer, keyed by the id stored under `proms`. */
export const QUESTIONNAIRES = { odi: ODI, ndi: NDI, mjoa: MJOA, srs22r: SRS22R };

/** Score any instrument by id; null until something has been answered. */
export function scoreQuestionnaire(id, answers) {
  if (!answers || !Object.keys(answers).length) return null;
  if (id === 'odi') return scoreOdiNdi(answers, ODI);
  if (id === 'ndi') return scoreOdiNdi(answers, NDI);
  if (id === 'mjoa') return scoreMJOA(answers);
  if (id === 'srs22r') return scoreSRS22R(answers);
  return null;
}

/**
 * Spanish and Chinese for every patient-facing string this module defines:
 * the names, descriptions, items, options, interpretations and the words of
 * the score preview. components/steps/PROMs.js spreads it into its
 * dictionary; the nine other languages come from lib/translations, built by
 * scripts/translate-ui.mjs, which reads these keys too. Scoring never touches
 * a translated string: it runs on numeric `option.score` values only.
 */
export const TRANSLATIONS = {
  // ---- Questionnaire names ----
  'Oswestry Disability Index (ODI)': { es: 'Índice de Discapacidad de Oswestry (ODI)', zh: 'Oswestry 功能障碍指数 (ODI)' },
  'Neck Disability Index (NDI)': { es: 'Índice de Discapacidad Cervical (NDI)', zh: '颈部功能障碍指数 (NDI)' },
  'Modified Japanese Orthopedic Association Score (mJOA)': { es: 'Puntuación Modificada de la Asociación Ortopédica Japonesa (mJOA)', zh: '改良日本骨科协会评分 (mJOA)' },
  'Scoliosis Research Society Questionnaire (SRS-22r)': { es: 'Cuestionario de la Sociedad de Investigación de Escoliosis (SRS-22r)', zh: '脊柱侧凸研究学会问卷 (SRS-22r)' },
  // ---- Questionnaire descriptions ----
  'This questionnaire helps us understand how your low back pain affects your daily activities.': { es: 'Este cuestionario nos ayuda a entender cómo su dolor lumbar afecta sus actividades diarias.', zh: '本问卷帮助我们了解您的下背部疼痛如何影响您的日常活动。' },
  'This questionnaire helps us understand how your neck pain affects your daily activities.': { es: 'Este cuestionario nos ayuda a entender cómo su dolor de cuello afecta sus actividades diarias.', zh: '本问卷帮助我们了解您的颈部疼痛如何影响您的日常活动。' },
  'This questionnaire evaluates how well your arms, legs, and coordination are functioning. Please select the statement that best describes you right now.': { es: 'Este cuestionario evalúa qué tan bien funcionan sus brazos, piernas y coordinación. Por favor seleccione la afirmación que mejor lo describe en este momento.', zh: '本问卷评估您的手臂、腿部和协调能力的功能状况。请选择最能描述您目前情况的选项。' },
  'This questionnaire helps us understand how your spinal condition affects your daily life, appearance, and well-being.': { es: 'Este cuestionario nos ayuda a entender cómo su afección de la columna afecta su vida diaria, su apariencia y su bienestar.', zh: '本问卷帮助我们了解您的脊柱疾病如何影响您的日常生活、外观和身心健康。' },
  // ---- ODI items ----
  'Pain Intensity': { es: 'Intensidad del dolor', zh: '疼痛强度' },
  'Personal Care (Washing, Dressing, etc.)': { es: 'Cuidado personal (lavarse, vestirse, etc.)', zh: '个人护理（洗漱、穿衣等）' },
  'Lifting': { es: 'Levantar objetos', zh: '提举物品' },
  'Walking': { es: 'Caminar', zh: '行走' },
  'Sitting': { es: 'Sentarse', zh: '坐姿' },
  'Standing': { es: 'Estar de pie', zh: '站立' },
  'Sleeping': { es: 'Dormir', zh: '睡眠' },
  'Sex Life (if applicable)': { es: 'Vida sexual (si aplica)', zh: '性生活（如适用）' },
  'Social Life': { es: 'Vida social', zh: '社交生活' },
  'Traveling': { es: 'Viajar', zh: '出行' },
  // ---- ODI answer options ----
  'I have no pain at the moment': { es: 'No tengo dolor en este momento', zh: '此刻我没有疼痛' },
  'The pain is very mild at the moment': { es: 'El dolor es muy leve en este momento', zh: '此刻疼痛非常轻微' },
  'The pain is moderate at the moment': { es: 'El dolor es moderado en este momento', zh: '此刻疼痛为中度' },
  'The pain is fairly severe at the moment': { es: 'El dolor es bastante intenso en este momento', zh: '此刻疼痛相当严重' },
  'The pain is very severe at the moment': { es: 'El dolor es muy intenso en este momento', zh: '此刻疼痛非常严重' },
  'The pain is the worst imaginable at the moment': { es: 'El dolor es el peor imaginable en este momento', zh: '此刻疼痛是难以想象的剧烈' },
  'I can look after myself normally without causing extra pain': { es: 'Puedo cuidarme normalmente sin causar dolor adicional', zh: '我能正常照顾自己，且不会引起额外疼痛' },
  'I can look after myself normally but it causes extra pain': { es: 'Puedo cuidarme normalmente pero me causa dolor adicional', zh: '我能正常照顾自己，但会引起额外疼痛' },
  'It is painful to look after myself and I am slow and careful': { es: 'Cuidarme es doloroso y lo hago lento y con cuidado', zh: '照顾自己时会疼痛，我动作缓慢而小心' },
  'I need some help but can manage most of my personal care': { es: 'Necesito algo de ayuda pero puedo hacer la mayor parte de mi cuidado personal', zh: '我需要一些帮助，但大部分个人护理能自理' },
  'I need help every day in most aspects of self-care': { es: 'Necesito ayuda todos los días en la mayoría de los aspectos del cuidado personal', zh: '我在大部分个人护理方面每天都需要帮助' },
  'I do not get dressed, I wash with difficulty, and stay in bed': { es: 'No me visto, me lavo con dificultad y permanezco en cama', zh: '我无法穿衣，洗漱困难，只能卧床' },
  'I can lift heavy weights without extra pain': { es: 'Puedo levantar objetos pesados sin dolor adicional', zh: '我能提举重物，且不会引起额外疼痛' },
  'I can lift heavy weights but it gives me extra pain': { es: 'Puedo levantar objetos pesados pero me causa dolor adicional', zh: '我能提举重物，但会引起额外疼痛' },
  'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently placed': { es: 'El dolor me impide levantar objetos pesados del suelo, pero puedo hacerlo si están en una posición cómoda', zh: '疼痛使我无法从地面提举重物，但如果物品放在方便的位置，我可以做到' },
  'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if they are conveniently positioned': { es: 'El dolor me impide levantar objetos pesados, pero puedo con pesos ligeros a medianos si están en una posición cómoda', zh: '疼痛使我无法提举重物，但如果物品放在方便的位置，我可以提举轻到中等重量的物品' },
  'I can only lift very light weights': { es: 'Solo puedo levantar objetos muy livianos', zh: '我只能提举非常轻的物品' },
  'I cannot lift or carry anything at all': { es: 'No puedo levantar ni cargar nada en absoluto', zh: '我完全无法提举或搬运任何东西' },
  'Pain does not prevent me from walking any distance': { es: 'El dolor no me impide caminar ninguna distancia', zh: '疼痛不影响我行走任何距离' },
  'Pain prevents me from walking more than 1 mile': { es: 'El dolor me impide caminar más de 1 milla (1,6 km)', zh: '疼痛使我无法行走超过1英里（约1.6公里）' },
  'Pain prevents me from walking more than 1/2 mile': { es: 'El dolor me impide caminar más de 1/2 milla (0,8 km)', zh: '疼痛使我无法行走超过半英里（约0.8公里）' },
  'Pain prevents me from walking more than 100 yards': { es: 'El dolor me impide caminar más de 100 yardas (90 m)', zh: '疼痛使我无法行走超过100码（约90米）' },
  'I can only walk using a cane or crutches': { es: 'Solo puedo caminar usando un bastón o muletas', zh: '我只能借助拐杖行走' },
  'I am in bed most of the time': { es: 'Paso la mayor parte del tiempo en cama', zh: '我大部分时间卧床' },
  'I can sit in any chair as long as I like': { es: 'Puedo sentarme en cualquier silla todo el tiempo que quiera', zh: '我可以在任何椅子上想坐多久就坐多久' },
  'I can only sit in my favorite chair as long as I like': { es: 'Solo puedo sentarme en mi silla favorita todo el tiempo que quiera', zh: '我只能在我最喜欢的椅子上想坐多久就坐多久' },
  'Pain prevents me from sitting for more than 1 hour': { es: 'El dolor me impide estar sentado más de 1 hora', zh: '疼痛使我无法坐超过1小时' },
  'Pain prevents me from sitting for more than 30 minutes': { es: 'El dolor me impide estar sentado más de 30 minutos', zh: '疼痛使我无法坐超过30分钟' },
  'Pain prevents me from sitting for more than 10 minutes': { es: 'El dolor me impide estar sentado más de 10 minutos', zh: '疼痛使我无法坐超过10分钟' },
  'Pain prevents me from sitting at all': { es: 'El dolor me impide estar sentado en absoluto', zh: '疼痛使我完全无法坐下' },
  'I can stand as long as I want without extra pain': { es: 'Puedo estar de pie todo el tiempo que quiera sin dolor adicional', zh: '我能想站多久就站多久，且不会引起额外疼痛' },
  'I can stand as long as I want but it gives me extra pain': { es: 'Puedo estar de pie todo el tiempo que quiera pero me causa dolor adicional', zh: '我能想站多久就站多久，但会引起额外疼痛' },
  'Pain prevents me from standing for more than 1 hour': { es: 'El dolor me impide estar de pie más de 1 hora', zh: '疼痛使我无法站立超过1小时' },
  'Pain prevents me from standing for more than 30 minutes': { es: 'El dolor me impide estar de pie más de 30 minutos', zh: '疼痛使我无法站立超过30分钟' },
  'Pain prevents me from standing for more than 10 minutes': { es: 'El dolor me impide estar de pie más de 10 minutos', zh: '疼痛使我无法站立超过10分钟' },
  'Pain prevents me from standing at all': { es: 'El dolor me impide estar de pie en absoluto', zh: '疼痛使我完全无法站立' },
  'My sleep is never disturbed by pain': { es: 'El dolor nunca perturba mi sueño', zh: '疼痛从不干扰我的睡眠' },
  'My sleep is occasionally disturbed by pain': { es: 'El dolor perturba mi sueño ocasionalmente', zh: '疼痛偶尔干扰我的睡眠' },
  'Because of pain I have less than 6 hours of sleep': { es: 'Debido al dolor duermo menos de 6 horas', zh: '由于疼痛我的睡眠不足6小时' },
  'Because of pain I have less than 4 hours of sleep': { es: 'Debido al dolor duermo menos de 4 horas', zh: '由于疼痛我的睡眠不足4小时' },
  'Because of pain I have less than 2 hours of sleep': { es: 'Debido al dolor duermo menos de 2 horas', zh: '由于疼痛我的睡眠不足2小时' },
  'Pain prevents me from sleeping at all': { es: 'El dolor me impide dormir en absoluto', zh: '疼痛使我完全无法入睡' },
  'My sex life is normal and causes no extra pain': { es: 'Mi vida sexual es normal y no causa dolor adicional', zh: '我的性生活正常，且不会引起额外疼痛' },
  'My sex life is normal but causes some extra pain': { es: 'Mi vida sexual es normal pero causa algo de dolor adicional', zh: '我的性生活正常，但会引起一些额外疼痛' },
  'My sex life is nearly normal but is very painful': { es: 'Mi vida sexual es casi normal pero es muy dolorosa', zh: '我的性生活几乎正常，但非常疼痛' },
  'My sex life is severely restricted by pain': { es: 'Mi vida sexual está muy restringida por el dolor', zh: '我的性生活因疼痛而严重受限' },
  'My sex life is nearly absent because of pain': { es: 'Mi vida sexual es casi inexistente debido al dolor', zh: '由于疼痛我的性生活几乎不存在' },
  'Pain prevents any sex life at all': { es: 'El dolor impide toda vida sexual', zh: '疼痛使我完全无法进行性生活' },
  'My social life is normal and gives me no extra pain': { es: 'Mi vida social es normal y no me causa dolor adicional', zh: '我的社交生活正常，且不会引起额外疼痛' },
  'My social life is normal but increases the degree of pain': { es: 'Mi vida social es normal pero aumenta el grado de dolor', zh: '我的社交生活正常，但会加重疼痛程度' },
  'Pain has no significant effect on my social life apart from limiting my more energetic interests': { es: 'El dolor no afecta mi vida social de forma significativa, salvo que limita mis intereses más enérgicos', zh: '除了限制我较为剧烈的兴趣活动外，疼痛对我的社交生活没有明显影响' },
  'Pain has restricted my social life and I do not go out as often': { es: 'El dolor ha restringido mi vida social y salgo con menos frecuencia', zh: '疼痛限制了我的社交生活，我外出的次数减少了' },
  'Pain has restricted my social life to my home': { es: 'El dolor ha restringido mi vida social a mi hogar', zh: '疼痛使我的社交生活局限在家中' },
  'I have no social life because of pain': { es: 'No tengo vida social debido al dolor', zh: '由于疼痛我没有社交生活' },
  'I can travel anywhere without pain': { es: 'Puedo viajar a cualquier lugar sin dolor', zh: '我可以去任何地方旅行而不感到疼痛' },
  'I can travel anywhere but it gives me extra pain': { es: 'Puedo viajar a cualquier lugar pero me causa dolor adicional', zh: '我可以去任何地方旅行，但会引起额外疼痛' },
  'Pain is bad but I manage journeys over 2 hours': { es: 'El dolor es intenso pero puedo hacer viajes de más de 2 horas', zh: '疼痛严重，但我能应对超过2小时的行程' },
  'Pain restricts me to journeys of less than 1 hour': { es: 'El dolor me limita a viajes de menos de 1 hora', zh: '疼痛使我只能进行不到1小时的行程' },
  'Pain restricts me to short necessary journeys under 30 minutes': { es: 'El dolor me limita a viajes cortos necesarios de menos de 30 minutos', zh: '疼痛使我只能进行不到30分钟的必要短途行程' },
  'Pain prevents me from traveling except to receive treatment': { es: 'El dolor me impide viajar excepto para recibir tratamiento', zh: '除接受治疗外，疼痛使我无法出行' },
  // ---- NDI items ----
  'Reading': { es: 'Leer', zh: '阅读' },
  'Headaches': { es: 'Dolores de cabeza', zh: '头痛' },
  'Concentration': { es: 'Concentración', zh: '注意力' },
  'Work': { es: 'Trabajo', zh: '工作' },
  'Driving': { es: 'Conducir', zh: '驾驶' },
  'Recreation': { es: 'Actividades recreativas', zh: '娱乐活动' },
  // ---- NDI answer options ----
  'Pain prevents me from lifting heavy weights off the floor, but I can if they are conveniently placed': { es: 'El dolor me impide levantar objetos pesados del suelo, pero puedo si están en una posición cómoda', zh: '疼痛使我无法从地面提举重物，但如果物品放在方便的位置我可以做到' },
  'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if conveniently positioned': { es: 'El dolor me impide levantar objetos pesados, pero puedo con pesos ligeros a medianos si están en una posición cómoda', zh: '疼痛使我无法提举重物，但如果物品位置方便，我可以提举轻到中等重量的物品' },
  'I can read as much as I want to with no pain in my neck': { es: 'Puedo leer todo lo que quiera sin dolor en el cuello', zh: '我可以随心所欲地阅读，颈部没有疼痛' },
  'I can read as much as I want to with slight pain in my neck': { es: 'Puedo leer todo lo que quiera con dolor leve en el cuello', zh: '我可以随心所欲地阅读，颈部有轻微疼痛' },
  'I can read as much as I want with moderate pain in my neck': { es: 'Puedo leer todo lo que quiera con dolor moderado en el cuello', zh: '我可以随心所欲地阅读，颈部有中度疼痛' },
  "I can't read as much as I want because of moderate pain in my neck": { es: 'No puedo leer todo lo que quiero debido a un dolor moderado en el cuello', zh: '由于颈部中度疼痛，我无法随心所欲地阅读' },
  'I can hardly read at all because of severe pain in my neck': { es: 'Apenas puedo leer debido a un dolor intenso en el cuello', zh: '由于颈部剧烈疼痛，我几乎无法阅读' },
  'I cannot read at all': { es: 'No puedo leer en absoluto', zh: '我完全无法阅读' },
  'I have no headaches at all': { es: 'No tengo dolores de cabeza en absoluto', zh: '我完全没有头痛' },
  'I have slight headaches which come infrequently': { es: 'Tengo dolores de cabeza leves que aparecen con poca frecuencia', zh: '我偶尔有轻微头痛' },
  'I have moderate headaches which come infrequently': { es: 'Tengo dolores de cabeza moderados que aparecen con poca frecuencia', zh: '我偶尔有中度头痛' },
  'I have moderate headaches which come frequently': { es: 'Tengo dolores de cabeza moderados que aparecen con frecuencia', zh: '我经常有中度头痛' },
  'I have severe headaches which come frequently': { es: 'Tengo dolores de cabeza intensos que aparecen con frecuencia', zh: '我经常有剧烈头痛' },
  'I have headaches almost all the time': { es: 'Tengo dolores de cabeza casi todo el tiempo', zh: '我几乎一直都有头痛' },
  'I can concentrate fully when I want to with no difficulty': { es: 'Puedo concentrarme por completo cuando quiero sin dificultad', zh: '我想集中注意力时可以毫无困难地做到' },
  'I can concentrate fully when I want to with slight difficulty': { es: 'Puedo concentrarme por completo cuando quiero con una ligera dificultad', zh: '我想集中注意力时能做到，但有轻微困难' },
  'I have a fair degree of difficulty in concentrating when I want to': { es: 'Tengo bastante dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有相当程度的困难' },
  'I have a lot of difficulty in concentrating when I want to': { es: 'Tengo mucha dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有很大困难' },
  'I have a great deal of difficulty in concentrating when I want to': { es: 'Tengo muchísima dificultad para concentrarme cuando quiero', zh: '我想集中注意力时有极大困难' },
  'I cannot concentrate at all': { es: 'No puedo concentrarme en absoluto', zh: '我完全无法集中注意力' },
  'I can do as much work as I want to': { es: 'Puedo hacer todo el trabajo que quiera', zh: '我能完成我想做的所有工作' },
  'I can only do my usual work, but no more': { es: 'Solo puedo hacer mi trabajo habitual, pero nada más', zh: '我只能完成日常工作，无法再多' },
  'I can do most of my usual work, but no more': { es: 'Puedo hacer la mayor parte de mi trabajo habitual, pero nada más', zh: '我能完成大部分日常工作，但无法再多' },
  'I cannot do my usual work': { es: 'No puedo hacer mi trabajo habitual', zh: '我无法完成日常工作' },
  'I can hardly do any work at all': { es: 'Apenas puedo hacer trabajo alguno', zh: '我几乎无法做任何工作' },
  "I can't do any work at all": { es: 'No puedo hacer ningún trabajo en absoluto', zh: '我完全无法做任何工作' },
  'I can drive my car without any neck pain': { es: 'Puedo conducir mi auto sin ningún dolor de cuello', zh: '我开车时颈部没有任何疼痛' },
  'I can drive my car as long as I want with slight pain in my neck': { es: 'Puedo conducir mi auto todo lo que quiera con dolor leve en el cuello', zh: '我可以随心所欲地开车，颈部有轻微疼痛' },
  'I can drive my car as long as I want with moderate pain in my neck': { es: 'Puedo conducir mi auto todo lo que quiera con dolor moderado en el cuello', zh: '我可以随心所欲地开车，颈部有中度疼痛' },
  "I can't drive my car as long as I want because of moderate pain in my neck": { es: 'No puedo conducir mi auto todo lo que quiero debido a un dolor moderado en el cuello', zh: '由于颈部中度疼痛，我无法随心所欲地开车' },
  'I can hardly drive at all because of severe pain in my neck': { es: 'Apenas puedo conducir debido a un dolor intenso en el cuello', zh: '由于颈部剧烈疼痛，我几乎无法开车' },
  "I can't drive my car at all": { es: 'No puedo conducir mi auto en absoluto', zh: '我完全无法开车' },
  'I have no trouble sleeping': { es: 'No tengo problemas para dormir', zh: '我睡眠没有问题' },
  'My sleep is slightly disturbed (less than 1 hour sleepless)': { es: 'Mi sueño está ligeramente perturbado (menos de 1 hora sin dormir)', zh: '我的睡眠受到轻微干扰（失眠不足1小时）' },
  'My sleep is mildly disturbed (1–2 hours sleepless)': { es: 'Mi sueño está levemente perturbado (1 a 2 horas sin dormir)', zh: '我的睡眠受到轻度干扰（失眠1至2小时）' },
  'My sleep is moderately disturbed (2–3 hours sleepless)': { es: 'Mi sueño está moderadamente perturbado (2 a 3 horas sin dormir)', zh: '我的睡眠受到中度干扰（失眠2至3小时）' },
  'My sleep is greatly disturbed (3–5 hours sleepless)': { es: 'Mi sueño está muy perturbado (3 a 5 horas sin dormir)', zh: '我的睡眠受到严重干扰（失眠3至5小时）' },
  'My sleep is completely disturbed (5–7 hours sleepless)': { es: 'Mi sueño está completamente perturbado (5 a 7 horas sin dormir)', zh: '我的睡眠受到完全干扰（失眠5至7小时）' },
  'I am able to engage in all my recreation activities with no neck pain at all': { es: 'Puedo participar en todas mis actividades recreativas sin ningún dolor de cuello', zh: '我能参与所有娱乐活动，颈部完全没有疼痛' },
  'I am able to engage in all my recreation activities with some pain in my neck': { es: 'Puedo participar en todas mis actividades recreativas con algo de dolor en el cuello', zh: '我能参与所有娱乐活动，颈部有一些疼痛' },
  'I am able to engage in most, but not all, of my usual recreation activities because of pain in my neck': { es: 'Puedo participar en la mayoría, pero no en todas, mis actividades recreativas habituales debido al dolor de cuello', zh: '由于颈部疼痛，我能参与大部分但非全部的日常娱乐活动' },
  'I am able to engage in a few of my usual recreation activities because of pain in my neck': { es: 'Solo puedo participar en algunas de mis actividades recreativas habituales debido al dolor de cuello', zh: '由于颈部疼痛，我只能参与少数日常娱乐活动' },
  'I can hardly do any recreation activities because of pain in my neck': { es: 'Apenas puedo hacer actividades recreativas debido al dolor de cuello', zh: '由于颈部疼痛，我几乎无法进行任何娱乐活动' },
  "I can't do any recreation activities at all": { es: 'No puedo hacer ninguna actividad recreativa en absoluto', zh: '我完全无法进行任何娱乐活动' },
  // ---- mJOA items ----
  'Upper Extremity Motor Function': { es: 'Función motora de las extremidades superiores', zh: '上肢运动功能' },
  'Lower Extremity Motor Function': { es: 'Función motora de las extremidades inferiores', zh: '下肢运动功能' },
  'Upper Extremity Sensation': { es: 'Sensibilidad de las extremidades superiores', zh: '上肢感觉' },
  'Bladder Function': { es: 'Función de la vejiga', zh: '膀胱功能' },
  // ---- mJOA item subtitles ----
  'How well can you use your hands?': { es: '¿Qué tan bien puede usar las manos?', zh: '您的双手使用能力如何？' },
  'How well can you walk?': { es: '¿Qué tan bien puede caminar?', zh: '您的行走能力如何？' },
  'How is the feeling in your hands and arms?': { es: '¿Cómo es la sensibilidad en sus manos y brazos?', zh: '您手臂和双手的感觉如何？' },
  'How is your urinary control?': { es: '¿Cómo es su control urinario?', zh: '您的排尿控制能力如何？' },
  // ---- mJOA answer options ----
  'I have no difficulty with hand function — my writing, buttoning, and eating are normal': { es: 'No tengo dificultad con la función de las manos: escribir, abotonar y comer son normales', zh: '我的手部功能没有困难——书写、扣纽扣和进食都正常' },
  'I have slight difficulty with buttons or fine hand movements, but can do most things': { es: 'Tengo una ligera dificultad con los botones o los movimientos finos de la mano, pero puedo hacer la mayoría de las cosas', zh: '我在扣纽扣或手部精细动作方面有轻微困难，但大部分事情能做到' },
  'I have noticeable difficulty with buttons, writing, or handling small objects': { es: 'Tengo una dificultad notable con los botones, la escritura o el manejo de objetos pequeños', zh: '我在扣纽扣、书写或处理小物件方面有明显困难' },
  'I can move my hands but cannot button my shirt or handle chopsticks/utensils well': { es: 'Puedo mover las manos pero no puedo abotonar mi camisa ni manejar bien los cubiertos', zh: '我能活动双手，但无法扣衬衫纽扣，也无法很好地使用筷子或餐具' },
  'I can move my hands but cannot feed myself with a spoon': { es: 'Puedo mover las manos pero no puedo alimentarme con una cuchara', zh: '我能活动双手，但无法用勺子自己进食' },
  'I am unable to move my hands': { es: 'No puedo mover las manos', zh: '我无法活动双手' },
  'I walk normally with no balance or coordination issues': { es: 'Camino normalmente sin problemas de equilibrio ni de coordinación', zh: '我行走正常，没有平衡或协调问题' },
  'I walk on my own but notice mild balance or coordination issues': { es: 'Camino por mi cuenta pero noto problemas leves de equilibrio o coordinación', zh: '我能独立行走，但注意到轻微的平衡或协调问题' },
  'I can walk on my own including stairs, but I notice moderate instability': { es: 'Puedo caminar por mi cuenta, incluidas las escaleras, pero noto una inestabilidad moderada', zh: '我能独立行走，包括上下楼梯，但注意到中度不稳' },
  'I can walk on flat ground on my own but need a handrail for stairs': { es: 'Puedo caminar en terreno plano por mi cuenta pero necesito un pasamanos para las escaleras', zh: '我能在平地上独立行走，但上下楼梯需要扶手' },
  'I need a cane, walker, or someone to help me walk': { es: 'Necesito un bastón, un andador o que alguien me ayude a caminar', zh: '我需要拐杖、助行器或他人帮助才能行走' },
  'I can move my legs but I am unable to walk': { es: 'Puedo mover las piernas pero no puedo caminar', zh: '我能活动双腿，但无法行走' },
  'I am unable to move my legs but have some sensation': { es: 'No puedo mover las piernas pero tengo algo de sensibilidad', zh: '我无法活动双腿，但仍有一些感觉' },
  'I am unable to move my legs and have no sensation': { es: 'No puedo mover las piernas y no tengo sensibilidad', zh: '我无法活动双腿，也没有感觉' },
  'I have completely normal sensation in my hands and arms': { es: 'Tengo una sensibilidad completamente normal en las manos y los brazos', zh: '我手臂和双手的感觉完全正常' },
  'I have mild numbness or tingling in my hands or arms': { es: 'Tengo un leve entumecimiento u hormigueo en las manos o los brazos', zh: '我手臂或双手有轻微麻木或刺痛' },
  'I have significant numbness or pain in my hands or arms': { es: 'Tengo un entumecimiento o dolor significativo en las manos o los brazos', zh: '我手臂或双手有明显麻木或疼痛' },
  'I have complete loss of feeling in my hands': { es: 'Tengo una pérdida total de sensibilidad en las manos', zh: '我双手完全失去知觉' },
  'I have completely normal bladder function': { es: 'Tengo una función de la vejiga completamente normal', zh: '我的膀胱功能完全正常' },
  'I have mild difficulty — slight urgency or frequency': { es: 'Tengo una dificultad leve: ligera urgencia o frecuencia', zh: '我有轻微困难——轻度尿急或尿频' },
  'I have significant difficulty — I strain or have retention issues': { es: 'Tengo una dificultad significativa: hago esfuerzo o tengo problemas de retención', zh: '我有明显困难——排尿费力或有尿潴留问题' },
  'I am unable to control my bladder': { es: 'No puedo controlar mi vejiga', zh: '我无法控制膀胱' },
  // ---- SRS-22r items ----
  'Which best describes your pain over the past 6 months?': { es: '¿Cuál describe mejor su dolor durante los últimos 6 meses?', zh: '以下哪项最能描述您过去6个月的疼痛？' },
  'Over the past 6 months, how many months have you had back pain?': { es: 'Durante los últimos 6 meses, ¿cuántos meses ha tenido dolor de espalda?', zh: '在过去6个月中，您有多少个月出现过背痛？' },
  'During the past 6 months, have you felt so down in the dumps that nothing could cheer you up?': { es: 'Durante los últimos 6 meses, ¿se ha sentido tan decaído que nada podía animarlo?', zh: '在过去6个月中，您是否曾情绪低落到没有任何事能让您振作？' },
  'Do you feel that your spinal condition limits your daily activities?': { es: '¿Siente que su afección de la columna limita sus actividades diarias?', zh: '您是否觉得脊柱疾病限制了您的日常活动？' },
  'What is your current level of activity?': { es: '¿Cuál es su nivel actual de actividad?', zh: '您目前的活动水平如何？' },
  'How do you look in clothes?': { es: '¿Cómo se ve usted con la ropa puesta?', zh: '您穿衣服时的外观如何？' },
  'In the past 6 months, have you been a happy person?': { es: 'En los últimos 6 meses, ¿ha sido una persona feliz?', zh: '在过去6个月中，您是否是一个快乐的人？' },
  'Do you experience back pain at rest?': { es: '¿Experimenta dolor de espalda en reposo?', zh: '您在休息时是否感到背痛？' },
  'What is your current level of work/school activity?': { es: '¿Cuál es su nivel actual de actividad laboral o escolar?', zh: '您目前的工作/学习活动水平如何？' },
  'How do you feel about the appearance of your trunk/torso (the area of your body excluding arms, legs, and head)?': { es: '¿Cómo se siente respecto a la apariencia de su tronco (la parte del cuerpo excluyendo brazos, piernas y cabeza)?', zh: '您对自己躯干（不包括手臂、腿部和头部的身体部位）外观的感受如何？' },
  'Have you taken any pain medications in the past month for your back?': { es: '¿Ha tomado algún medicamento para el dolor de espalda en el último mes?', zh: '在过去一个月中，您是否为背部服用过任何止痛药？' },
  'Does your back condition limit your ability to do things around the house?': { es: '¿Su afección de espalda limita su capacidad para hacer tareas en el hogar?', zh: '您的背部疾病是否限制了您做家务的能力？' },
  'Have you felt calm and peaceful in the past 6 months?': { es: '¿Se ha sentido tranquilo y en paz en los últimos 6 meses?', zh: '在过去6个月中，您是否感到平静安宁？' },
  'Do you feel your spinal condition affects your body attractiveness?': { es: '¿Siente que su afección de la columna afecta el atractivo de su cuerpo?', zh: '您是否觉得脊柱疾病影响了您身体的吸引力？' },
  'Are you and/or your family experiencing financial difficulties because of your back?': { es: '¿Usted y/o su familia están teniendo dificultades económicas debido a su espalda?', zh: '您和/或您的家人是否因您的背部问题而遇到经济困难？' },
  'Have you been downhearted and blue in the past 6 months?': { es: '¿Se ha sentido desanimado y triste en los últimos 6 meses?', zh: '在过去6个月中，您是否感到沮丧和忧郁？' },
  'In the past 6 months, how often has your back pain been at rest?': { es: 'En los últimos 6 meses, ¿con qué frecuencia ha tenido dolor de espalda en reposo?', zh: '在过去6个月中，您在休息时出现背痛的频率如何？' },
  'In the past 3 months, how many days have you taken off from work/school because of back pain?': { es: 'En los últimos 3 meses, ¿cuántos días ha faltado al trabajo o a la escuela debido al dolor de espalda?', zh: '在过去3个月中，您因背痛而请假不上班/上学的天数有多少？' },
  'If you had to spend the rest of your life with your back as it is right now, how would you feel?': { es: 'Si tuviera que pasar el resto de su vida con su espalda tal como está ahora, ¿cómo se sentiría?', zh: '如果您的余生都要在背部处于目前状况下度过，您会有何感受？' },
  'Do you feel that your condition affects personal relationships?': { es: '¿Siente que su afección afecta sus relaciones personales?', zh: '您是否觉得您的病情影响了个人关系？' },
  'Are you satisfied with the results of your back management to date?': { es: '¿Está satisfecho con los resultados del tratamiento de su espalda hasta la fecha?', zh: '您对目前为止背部治疗的效果是否满意？' },
  'Would you have the same management again if you had the same condition?': { es: 'Si tuviera la misma afección, ¿volvería a elegir el mismo tratamiento?', zh: '如果您患有同样的病情，您是否会再次选择相同的治疗？' },
  // ---- SRS-22r domain names ----
  'Function/Activity': { es: 'Función/Actividad', zh: '功能/活动' },
  'Pain': { es: 'Dolor', zh: '疼痛' },
  'Self-Image/Appearance': { es: 'Autoimagen/Apariencia', zh: '自我形象/外观' },
  'Mental Health': { es: 'Salud mental', zh: '心理健康' },
  'Satisfaction with Management': { es: 'Satisfacción con el tratamiento', zh: '对治疗的满意度' },
  // ---- SRS-22r answer options ----
  'None': { es: 'Ninguno', zh: '无' },
  'Mild': { es: 'Leve', zh: '轻度' },
  'Moderate': { es: 'Moderado', zh: '中度' },
  'Moderate to severe': { es: 'De moderado a intenso', zh: '中度至重度' },
  'Severe': { es: 'Intenso', zh: '重度' },
  '0 months': { es: '0 meses', zh: '0个月' },
  '1 month': { es: '1 mes', zh: '1个月' },
  '2–3 months': { es: '2 a 3 meses', zh: '2至3个月' },
  '4–5 months': { es: '4 a 5 meses', zh: '4至5个月' },
  '6 months': { es: '6 meses', zh: '6个月' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Very often': { es: 'Muy a menudo', zh: '非常频繁' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'Full activities without restriction': { es: 'Actividades plenas sin restricción', zh: '完全活动，无限制' },
  'Full activities with mild restrictions': { es: 'Actividades plenas con restricciones leves', zh: '完全活动，有轻微限制' },
  'Light activities and sports, moderate restrictions': { es: 'Actividades y deportes ligeros, restricciones moderadas', zh: '轻度活动和运动，中度限制' },
  'Unable to do most activities': { es: 'Incapaz de realizar la mayoría de las actividades', zh: '无法进行大部分活动' },
  'Completely disabled, bedridden': { es: 'Completamente incapacitado, postrado en cama', zh: '完全丧失能力，卧床不起' },
  'Very good': { es: 'Muy bien', zh: '非常好' },
  'Good': { es: 'Bien', zh: '好' },
  'Fair': { es: 'Regular', zh: '一般' },
  'Poor': { es: 'Mal', zh: '差' },
  'Very poor': { es: 'Muy mal', zh: '非常差' },
  'All of the time': { es: 'Todo el tiempo', zh: '所有时间' },
  'Most of the time': { es: 'La mayor parte del tiempo', zh: '大部分时间' },
  'Some of the time': { es: 'Parte del tiempo', zh: '部分时间' },
  'A little of the time': { es: 'Un poco del tiempo', zh: '少部分时间' },
  'None of the time': { es: 'En ningún momento', zh: '没有任何时间' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Very often': { es: 'Muy a menudo', zh: '非常频繁' },
  'Full-time work/school, no restrictions': { es: 'Trabajo o escuela a tiempo completo, sin restricciones', zh: '全职工作/全日制学习，无限制' },
  'Full-time work/school, with mild restrictions': { es: 'Trabajo o escuela a tiempo completo, con restricciones leves', zh: '全职工作/全日制学习，有轻微限制' },
  'Part-time, or full-time with significant restrictions': { es: 'Tiempo parcial, o tiempo completo con restricciones significativas', zh: '兼职，或有明显限制的全职' },
  'Severely limited — unable to work/attend school': { es: 'Muy limitado: incapaz de trabajar o asistir a la escuela', zh: '严重受限——无法工作/上学' },
  'Completely disabled': { es: 'Completamente incapacitado', zh: '完全丧失能力' },
  'Very satisfied': { es: 'Muy satisfecho', zh: '非常满意' },
  'Satisfied': { es: 'Satisfecho', zh: '满意' },
  'Neither satisfied nor dissatisfied': { es: 'Ni satisfecho ni insatisfecho', zh: '既不满意也不满意' },
  'Dissatisfied': { es: 'Insatisfecho', zh: '不满意' },
  'Very dissatisfied': { es: 'Muy insatisfecho', zh: '非常不满意' },
  'None': { es: 'Ninguno', zh: '无' },
  '1 week or less of non-narcotic medications': { es: '1 semana o menos de medicamentos no narcóticos', zh: '服用非麻醉类药物1周或以内' },
  'More than 1 week of non-narcotics': { es: 'Más de 1 semana de medicamentos no narcóticos', zh: '服用非麻醉类药物超过1周' },
  '1 week or less of narcotic (opioid) medications': { es: '1 semana o menos de medicamentos narcóticos (opioides)', zh: '服用麻醉类（阿片类）药物1周或以内' },
  'More than 1 week of narcotic (opioid) medications': { es: 'Más de 1 semana de medicamentos narcóticos (opioides)', zh: '服用麻醉类（阿片类）药物超过1周' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'All of the time': { es: 'Todo el tiempo', zh: '所有时间' },
  'Most of the time': { es: 'La mayor parte del tiempo', zh: '大部分时间' },
  'Some of the time': { es: 'Parte del tiempo', zh: '部分时间' },
  'A little of the time': { es: 'Un poco del tiempo', zh: '少部分时间' },
  'None of the time': { es: 'En ningún momento', zh: '没有任何时间' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Very often': { es: 'Muy a menudo', zh: '非常频繁' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Rarely': { es: 'Rara vez', zh: '很少' },
  'Sometimes': { es: 'A veces', zh: '有时' },
  'Often': { es: 'A menudo', zh: '经常' },
  'Always': { es: 'Siempre', zh: '总是' },
  '0 days': { es: '0 días', zh: '0天' },
  '1–3 days': { es: '1 a 3 días', zh: '1至3天' },
  '4–7 days': { es: '4 a 7 días', zh: '4至7天' },
  '8–14 days': { es: '8 a 14 días', zh: '8至14天' },
  'More than 14 days': { es: 'Más de 14 días', zh: '超过14天' },
  'Very happy': { es: 'Muy feliz', zh: '非常高兴' },
  'Somewhat happy': { es: 'Algo feliz', zh: '有些高兴' },
  'Neither happy nor unhappy': { es: 'Ni feliz ni infeliz', zh: '既不高兴也不难过' },
  'Somewhat unhappy': { es: 'Algo infeliz', zh: '有些难过' },
  'Very unhappy': { es: 'Muy infeliz', zh: '非常难过' },
  'Not at all': { es: 'En absoluto', zh: '完全没有' },
  'Slightly': { es: 'Ligeramente', zh: '轻微' },
  'Moderately': { es: 'Moderadamente', zh: '中等程度' },
  'Quite a bit': { es: 'Bastante', zh: '相当多' },
  'Very much': { es: 'Muchísimo', zh: '非常严重' },
  'Very satisfied': { es: 'Muy satisfecho', zh: '非常满意' },
  'Satisfied': { es: 'Satisfecho', zh: '满意' },
  'Neither satisfied nor dissatisfied': { es: 'Ni satisfecho ni insatisfecho', zh: '既不满意也不满意' },
  'Dissatisfied': { es: 'Insatisfecho', zh: '不满意' },
  'Very dissatisfied': { es: 'Muy insatisfecho', zh: '非常不满意' },
  'Definitely yes': { es: 'Definitivamente sí', zh: '肯定会' },
  'Probably yes': { es: 'Probablemente sí', zh: '可能会' },
  'Not sure': { es: 'No estoy seguro', zh: '不确定' },
  'Probably not': { es: 'Probablemente no', zh: '可能不会' },
  'Definitely not': { es: 'Definitivamente no', zh: '肯定不会' },
  // ---- Interpretations and score-preview words ----
  'Minimal disability': { es: 'Discapacidad mínima', zh: '轻微功能障碍' },
  'Moderate disability': { es: 'Discapacidad moderada', zh: '中度功能障碍' },
  'Severe disability': { es: 'Discapacidad grave', zh: '重度功能障碍' },
  'Crippled': { es: 'Discapacidad muy grave', zh: '极重度功能障碍' },
  'Bed-bound or exaggerating symptoms': { es: 'Postrado en cama o síntomas exagerados', zh: '卧床不起或症状夸大' },
  'No myelopathy': { es: 'Sin mielopatía', zh: '无脊髓病' },
  'Mild myelopathy': { es: 'Mielopatía leve', zh: '轻度脊髓病' },
  'Moderate myelopathy': { es: 'Mielopatía moderada', zh: '中度脊髓病' },
  'Severe myelopathy': { es: 'Mielopatía grave', zh: '重度脊髓病' },
  'sections': { es: 'secciones', zh: '个部分' },
  'overall mean': { es: 'media general', zh: '总体平均分' },
};
