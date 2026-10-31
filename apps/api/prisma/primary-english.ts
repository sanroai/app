/**
 * Primary English (classes 1-4) - the NCERT Marigold course.
 *
 * The seeded curriculum covered Science + Mathematics for classes 1-4 and all
 * three subjects from class 5, so English simply did not exist for the primary
 * classes ("why english not available from class 1 to 4"). This module adds it:
 * one chapter per Marigold unit (the poem and the story together), each with
 * concepts, a real NCERT-aligned video, study notes and practice questions.
 *
 * It is a separate module so the 1.4 MB `seed.ts` stays reviewable: the seed
 * merges these tables into the curriculum, the lesson list, the video map, the
 * notes map and the question list.
 */

export type PrimaryChapterSpec = {
  name: string;
  code: string;
  topics: { name: string; concepts: string[] }[];
};

export const PRIMARY_ENGLISH_CURRICULUM: Record<string, PrimaryChapterSpec[]> = {
  '1': [
    {
      name: 'A Happy Child',
      code: 'ENG-1-1',
      topics: [
        { name: 'The Poem: A Happy Child', concepts: ['A Happy Home', 'Rhyme and Rhythm'] },
        { name: 'The Story: Three Little Pigs', concepts: ['The Three Houses', 'Hard Work Saves the Day'] },
      ],
    },
    {
      name: 'After a Bath',
      code: 'ENG-1-2',
      topics: [
        { name: 'The Poem: After a Bath', concepts: ['Getting Ready', 'Action Words'] },
        { name: 'The Story: The Bubble, the Straw and the Shoe', concepts: ['Three Friends', 'Working Together'] },
      ],
    },
    {
      name: 'One Little Kitten',
      code: 'ENG-1-3',
      topics: [
        { name: 'The Poem: One Little Kitten', concepts: ['Counting Friends', 'Animal Names'] },
        { name: 'The Story: Lalu and Peelu', concepts: ['Lalu the Chick', 'Trying New Food'] },
      ],
    },
    {
      name: 'Once I Saw a Little Bird',
      code: 'ENG-1-4',
      topics: [
        { name: 'The Poem: Once I Saw a Little Bird', concepts: ['The Little Bird', 'Being Polite'] },
        { name: 'The Story: Mittu and the Yellow Mango', concepts: ['Mittu the Parrot', 'Sharing and Helping'] },
      ],
    },
    {
      name: 'Merry-Go-Round',
      code: 'ENG-1-5',
      topics: [
        { name: 'The Poem: Merry-Go-Round', concepts: ['Up and Down', 'Sounds and Rhymes'] },
        { name: 'The Story: Circle', concepts: ['Round Things', 'Shapes Around Us'] },
      ],
    },
  ],
  '2': [
    {
      name: 'First Day at School',
      code: 'ENG-2-1',
      topics: [
        { name: 'The Poem: First Day at School', concepts: ['A New School', 'Feelings'] },
        { name: "The Story: Haldi's Adventure", concepts: ["Haldi's Journey", 'Curiosity and Courage'] },
      ],
    },
    {
      name: 'I am Lucky',
      code: 'ENG-2-2',
      topics: [
        { name: 'The Poem: I am Lucky', concepts: ['What I Can Do', 'Being Thankful'] },
        { name: 'The Story: I Want', concepts: ['Asking Politely', 'Wants and Needs'] },
      ],
    },
    {
      name: 'A Smile',
      code: 'ENG-2-3',
      topics: [
        { name: 'The Poem: A Smile', concepts: ['The Power of a Smile', 'Rhyming Words'] },
        { name: 'The Story: The Wind and the Sun', concepts: ['The Challenge', 'Gentleness Wins'] },
      ],
    },
    {
      name: 'Rain',
      code: 'ENG-2-4',
      topics: [
        { name: 'The Poem: Rain', concepts: ['A Rainy Day', 'Sound Words'] },
        { name: 'The Story: Storm in the Garden', concepts: ['The Storm', 'Helping Each Other'] },
      ],
    },
    {
      name: 'Zoo Manners',
      code: 'ENG-2-5',
      topics: [
        { name: 'The Poem: Zoo Manners', concepts: ['Manners at the Zoo', 'Opposites'] },
        { name: 'The Story: Funny Bunny', concepts: ['Funny Bunny', 'Good Manners'] },
      ],
    },
  ],
  '3': [
    {
      name: 'Good Morning',
      code: 'ENG-3-1',
      topics: [
        { name: 'The Poem: Good Morning', concepts: ['Greetings', 'Nature in the Morning'] },
        { name: 'The Story: The Magic Garden', concepts: ['The Garden', 'Kindness Rewarded'] },
      ],
    },
    {
      name: 'Bird Talk',
      code: 'ENG-3-2',
      topics: [
        { name: 'The Poem: Bird Talk', concepts: ["The Birds' Conversation", 'Rhyme'] },
        { name: 'The Story: Nina and the Baby Sparrows', concepts: ["The Sparrow's Nest", 'Caring for Birds'] },
      ],
    },
    {
      name: 'Little by Little',
      code: 'ENG-3-3',
      topics: [
        { name: 'The Poem: Little by Little', concepts: ['Small Steps', 'Patience'] },
        { name: 'The Story: The Enormous Turnip', concepts: ['Pulling Together', 'Teamwork'] },
      ],
    },
    {
      name: 'Sea Song',
      code: 'ENG-3-4',
      topics: [
        { name: 'The Poem: Sea Song', concepts: ['The Sea', 'Imagination'] },
        { name: 'The Story: A Little Fish Story', concepts: ['The Little Fish', 'Helping Others'] },
      ],
    },
    {
      name: 'The Balloon Man',
      code: 'ENG-3-5',
      topics: [
        { name: 'The Poem: The Balloon Man', concepts: ['Balloons in the Sky', 'Rhyme and Repetition'] },
        { name: 'The Story: The Yellow Butterfly', concepts: ['The Butterfly', 'Freedom'] },
      ],
    },
  ],
  '4': [
    {
      name: 'Wake Up!',
      code: 'ENG-4-1',
      topics: [
        { name: 'The Poem: Wake Up!', concepts: ['Morning Routine', 'Commands and Requests'] },
        { name: "The Story: Neha's Alarm Clock", concepts: ["Neha's Problem", 'Being Responsible'] },
      ],
    },
    {
      name: 'Noses',
      code: 'ENG-4-2',
      topics: [
        { name: 'The Poem: Noses', concepts: ['Funny Faces', 'Rhyme'] },
        { name: 'The Story: The Little Fir Tree', concepts: ['The Fir Tree', 'Be Careful What You Wish For'] },
      ],
    },
    {
      name: 'Run!',
      code: 'ENG-4-3',
      topics: [
        { name: 'The Poem: Run!', concepts: ['Movement', 'Rhyme and Repetition'] },
        { name: "The Story: Nasruddin's Aim", concepts: ["Nasruddin's Shot", 'Wit and Wisdom'] },
      ],
    },
    {
      name: 'Why?',
      code: 'ENG-4-4',
      topics: [
        { name: 'The Poem: Why?', concepts: ['Questions', 'Curiosity'] },
        { name: 'The Story: Alice in Wonderland', concepts: ['Down the Rabbit Hole', 'Imagination'] },
      ],
    },
    {
      name: "Don't be Afraid of the Dark",
      code: 'ENG-4-5',
      topics: [
        { name: "The Poem: Don't be Afraid of the Dark", concepts: ['Overcoming Fear', 'Night Time'] },
        { name: 'The Story: Helen Keller', concepts: ["Helen's World", 'Courage and Learning'] },
      ],
    },
  ],
};

/** One real NCERT-aligned lesson video per chapter (verified with YouTube oEmbed). */
export const PRIMARY_ENGLISH_VIDEO_IDS: Record<string, string> = {
  'ENG-1-1': 'j4lBUUKG4G0',
  'ENG-1-2': 'oZjWKycVYm8',
  'ENG-1-3': 'wdthnELJG_4',
  'ENG-1-4': 'DSCcfYPa92k',
  'ENG-1-5': 'I8hkcIbNMAA',
  'ENG-2-1': 'MllrWpvpfiQ',
  'ENG-2-2': '-3oq9Xc7qAQ',
  'ENG-2-3': 'beIOTMhnsLI',
  'ENG-2-4': '3jAlEaFXoo8',
  'ENG-2-5': 'B_j6BpGs3JY',
  'ENG-3-1': 'cjxQuBmRtmk',
  'ENG-3-2': '6ynOpfrJVZI',
  'ENG-3-3': 'BRRfcfXA-aY',
  'ENG-3-4': 'q-RKgKSKeF0',
  'ENG-3-5': '2Aljr6E5mQY',
  'ENG-4-1': 'gNm1d4Ki_qk',
  'ENG-4-2': 'eAbEyFG9_aU',
  'ENG-4-3': 'LsYZf8Ozxww',
  'ENG-4-4': 'YbWXM9cW3yA',
  'ENG-4-5': 'VP7QJgj5jTM',
};

/** Real runtime of each lesson video in seconds (audited against YouTube). */
export const PRIMARY_ENGLISH_DURATIONS: Record<string, number> = {
  'ENG-1-1': 1256,
  'ENG-1-2': 1485,
  'ENG-1-3': 1226,
  'ENG-1-4': 956,
  'ENG-1-5': 923,
  'ENG-2-1': 834,
  'ENG-2-2': 1533,
  'ENG-2-3': 957,
  'ENG-2-4': 709,
  'ENG-2-5': 629,
  'ENG-3-1': 608,
  'ENG-3-2': 916,
  'ENG-3-3': 1051,
  'ENG-3-4': 784,
  'ENG-3-5': 1141,
  'ENG-4-1': 687,
  'ENG-4-2': 1246,
  'ENG-4-3': 839,
  'ENG-4-4': 563,
  'ENG-4-5': 807,
};

/** The two content items every chapter carries: one video, one notes lesson. */
export const PRIMARY_ENGLISH_LESSONS = Object.entries(PRIMARY_ENGLISH_CURRICULUM).flatMap(
  ([grade, chapters]) =>
    chapters.flatMap((chapter) => {
      const concept = chapter.topics[0].concepts[0];
      return [
        {
          ch: chapter.name,
          subjectName: 'English',
          grade,
          concept,
          type: 'VIDEO' as const,
          title: `${chapter.name} - Video Lesson`,
          duration: PRIMARY_ENGLISH_DURATIONS[chapter.code] ?? 300,
        },
        {
          ch: chapter.name,
          subjectName: 'English',
          grade,
          concept,
          type: 'NOTES' as const,
          title: `${chapter.name} - Study Notes`,
          duration: 420,
        },
      ];
    }),
);

export const PRIMARY_ENGLISH_VIDEO_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIMARY_ENGLISH_VIDEO_IDS).map(([code, id]) => {
    const chapter = Object.values(PRIMARY_ENGLISH_CURRICULUM)
      .flat()
      .find((entry) => entry.code === code)!;
    return [`${chapter.name} - Video Lesson`, `https://www.youtube.com/embed/${id}`];
  }),
);

/** Study notes per chapter, keyed by the NOTES lesson title. */
export const PRIMARY_ENGLISH_NOTES: Record<string, string> = {
  'A Happy Child - Study Notes': `## The Poem: A Happy Child
- The speaker is a **happy child** who lives in a **red and white house**.
- The house has a **window** that looks out on a **green garden**, and the child is happy all day.
- "I am a happy child" is repeated, so the poem sounds like a song.
- The child **laughs and plays** with friends in the garden.
- The poem teaches that a **happy home** and **friends** make us happy, not big things.

## Rhyme and Rhythm
- Words that end with the same sound **rhyme**: *white - bright*, *day - play*.
- A **poem** has short lines and a **rhythm** - we can clap the beat of each line.
- Say the poem aloud and clap once for every strong beat.

## The Story: Three Little Pigs
- Three little pigs leave home to build their own houses.
- The first pig builds a house of **straw**, the second a house of **sticks**, the third a house of **bricks**.
- A **wolf** comes and blows the straw house down, then the stick house.
- The brick house does **not** fall, because the third pig worked slowly and carefully.
- **Moral:** hard work and doing a job properly keep us safe.

## New Words
- **straw** - dried stems of grain plants.
- **bricks** - hard blocks used to build walls.
- **huff and puff** - to blow hard.
- **chimney** - a pipe on a roof that lets smoke out.`,

  'After a Bath - Study Notes': `## The Poem: After a Bath
- The poem is about a child who has just had a **bath** and is being **dried**.
- The towel rubs the **hands**, then the **fingers**, the **legs** and the **toes**.
- The child says "I am **wet**" and the towel must **dry** every part.
- The poem uses **repetition**: each line asks the towel to dry one more part.
- It shows a daily **habit**: keeping our body **clean**.

## Action Words
- **Action words (verbs)** tell us what someone does: *rub, dry, run, jump, wash*.
- "Dry my hands" and "dry my toes" both begin with an action word.
- Find the action word: *Rub* the towel, *wash* the face, *comb* the hair.

## The Story: The Bubble, the Straw and the Shoe
- A **bubble**, a **straw** and a **shoe** become friends and go into the forest.
- They reach a **stream** and cannot cross it.
- The **straw** lies across the water to make a bridge, the **shoe** floats as a boat, and the **bubble** goes last.
- The straw breaks and the bubble bursts; the friends learn to be careful.
- **Moral:** friends must help one another, and a plan must be safe for everyone.

## New Words
- **bubble** - a ball of air inside a thin film of soapy water.
- **straw** - a thin, hollow stem.
- **stream** - a small river.
- **burst** - to break open suddenly.`,

  'One Little Kitten - Study Notes': `## The Poem: One Little Kitten
- The poem counts animals: **one little kitten**, then two, three and more friends.
- Each animal has its own **sound word**: the kitten *mews*, the dog *barks*, the cow *moos*.
- The animals play together and are never alone.
- The poem teaches **counting** from one to ten in a playful way.
- It also teaches **animal names** and the sounds they make.

## Counting Friends
- Say the numbers in order: one, two, three, four, five, six, seven, eight, nine, ten.
- Count the animals in the picture and match each one with a number.

## The Story: Lalu and Peelu
- **Lalu** is a little yellow chick who will eat only **yellow** things.
- **Peelu** is his friend, a red chick who eats only **red** things.
- Lalu refuses green vegetables and fruit, so he feels weak.
- Peelu shows him how tasty a **green** leaf can be, and Lalu tries it.
- Lalu learns to eat **many kinds of food**, not just one colour.
- **Moral:** a good eater tries different foods; a **balanced diet** keeps us strong.

## New Words
- **chick** - a baby hen.
- **peck** - to pick up food with the beak.
- **healthy** - strong and well.
- **vegetables** - plants we eat as food.`,

  'Once I Saw a Little Bird - Study Notes': `## The Poem: Once I Saw a Little Bird
- The speaker sees a **little bird** sitting at the **window**.
- He says "Little bird, will you **stop**?" and asks it to stay.
- The bird says **no** and **flies away**.
- The poem repeats the same pattern, so children can say it easily.
- It teaches us to **watch** birds without **catching** them.

## Being Polite
- **Polite words**: please, thank you, sorry, excuse me.
- "Will you stop?" is a **request**; "Stop!" is a **command**.
- We speak softly to animals and never hurt them.

## The Story: Mittu and the Yellow Mango
- **Mittu** is a green **parrot** who loves to fly in the garden.
- He sees a big **yellow mango** high on a tree and wants it.
- A **crow** and a **monkey** also want the mango, but they cannot reach it together.
- Mittu asks his friends for help and they **work together** to get the fruit.
- They **share** the mango and all of them are happy.
- **Moral:** asking for help and sharing makes everyone happy.

## New Words
- **parrot** - a green bird with a curved beak.
- **mango** - a sweet yellow fruit.
- **share** - to let others have a part of what you have.
- **branch** - a part of a tree that grows out from the trunk.`,

  'Merry-Go-Round - Study Notes': `## The Poem: Merry-Go-Round
- The poem describes a **merry-go-round** in a fair.
- It goes **round and round**, and the children go **up and down**.
- The horses are painted in bright colours.
- The poem has a strong **beat**, like the music of the ride.
- It shows the **joy** of a fair and of playing with friends.

## Sounds and Rhymes
- **Sound words** copy a noise: *wheee, round and round, up and down*.
- Words that rhyme: *round - sound*, *down - town*.
- Clap the beat: "The merry-go-round goes **round and round**".

## The Story: Circle
- A **circle** is a **round shape** with no corners.
- Things that are round: a **wheel**, a **coin**, the **sun**, a **plate**, a **bangle**.
- The story shows a child who finds circles all around the house.
- A circle can **roll**, but a square cannot.
- **Shapes** help us describe the things we see.

## New Words
- **merry-go-round** - a round ride with seats that go up and down.
- **circle** - a round shape.
- **corner** - the point where two sides meet.
- **roll** - to move by turning over and over.`,

  'First Day at School - Study Notes': `## The Poem: First Day at School
- The poem describes the **first day** of school and how the child feels.
- The child is **nervous** at first, then meets new **friends** and feels better.
- The classroom has **desks**, a **board** and a **teacher** who smiles.
- Feelings named in the poem: **shy, happy, excited, afraid**.
- The poem says school is a place to **learn and play**.

## Feelings
- **Happy, sad, angry, scared, excited, shy** are all feelings.
- We can say "I feel ___" to tell someone how we feel.
- Talking about feelings helps us feel **safe**.

## The Story: Haldi's Adventure
- **Haldi** is a little girl who goes out to see the world.
- She meets a **duck**, a **cat** and a **cow** on the way.
- Each animal teaches her something new.
- Haldi is **curious** and asks many questions.
- She comes home safely and tells her **mother** everything.
- **Moral:** being **curious and brave** helps us learn, and home is always there.

## New Words
- **adventure** - an exciting journey.
- **curious** - wanting to know more.
- **nervous** - a little afraid.
- **classroom** - a room where a class learns.`,

  'I am Lucky - Study Notes': `## The Poem: I am Lucky
- The speaker lists the things he **can do**: hop, skip, jump, sing, dance.
- Each line begins "I am lucky, I can ___".
- The poem teaches **self-confidence**: everyone can do something well.
- It ends by saying we should be **thankful** for what we have.

## What I Can Do
- "**Can**" shows **ability**: *I can swim. She can sing.*
- "**Cannot**" (can't) shows we are not able to do something.
- Ask a friend: "Can you jump?" - "Yes, I can." / "No, I can't."

## The Story: I Want
- A child **wants** many things: a toy, a balloon, an ice cream.
- The **mother** explains that we cannot get **everything** we want.
- The child learns the difference between **needs** (food, water, clothes) and **wants** (toys, sweets).
- Asking **politely** with "please" and "may I" works better than demanding.
- **Moral:** be happy with what you have and ask politely.

## New Words
- **lucky** - having good fortune.
- **want** - to wish for something.
- **need** - something we must have.
- **polite** - showing good manners.`,

  'A Smile - Study Notes': `## The Poem: A Smile
- A **smile** costs nothing but gives a lot.
- A smile makes other people **happy** and brings **friends** closer.
- The poem says a smile can **travel** from face to face.
- It repeats the word **smile** so we remember it.
- **Moral:** a small kind act can change someone's day.

## Rhyming Words
- Rhymes in the poem: *smile - while*, *day - say*, *face - place*.
- A **rhyme** has the same ending sound.
- Make more rhymes: *smile, mile, tile, while*.

## The Story: The Wind and the Sun
- The **wind** and the **sun** argue about who is stronger.
- They see a **traveller** in a **coat** and agree: whoever makes him take it off wins.
- The wind blows hard, but the traveller holds his coat **tighter**.
- The sun shines **warmly**, and the traveller takes the coat off himself.
- **Moral:** **gentleness** wins where force fails.

## New Words
- **traveller** - a person who is on a journey.
- **argue** - to disagree with words.
- **gentle** - kind and soft.
- **force** - power used to make someone do something.`,

  'Rain - Study Notes': `## The Poem: Rain
- The poem describes **rain** falling on the roof, the trees and the ground.
- **Sound words**: *pitter-patter*, *drip-drop*, *splash*.
- Rain makes the **earth smell fresh** and the **plants green**.
- The child in the poem wants to **go out and play** in the rain.
- The poem has a soft **rhythm**, like rain falling.

## A Rainy Day
- Things we use in the rain: **umbrella, raincoat, boots**.
- Rain fills **ponds, rivers and wells**, and helps farmers grow crops.
- We must **save water** and never waste it.

## The Story: Storm in the Garden
- A **storm** comes to a garden: strong wind, heavy rain, thunder.
- The **plants** bend and the **birds** hide in their nests.
- A little **squirrel** is afraid and a big **tree** protects it.
- After the storm the garden is **quiet and fresh**, and the sun comes out.
- **Moral:** in hard times we help and protect one another.

## New Words
- **storm** - very bad weather with wind and rain.
- **thunder** - the loud sound heard during a storm.
- **shelter** - a place that keeps us safe.
- **fresh** - clean and new.`,

  'Zoo Manners - Study Notes': `## The Poem: Zoo Manners
- The poem tells children how to behave at the **zoo**.
- Rules: do not **tease** the animals, do not **feed** them, do not **throw** things.
- We should **watch quietly** and speak softly.
- The animals are **not toys**; they need care and respect.
- **Moral:** good **manners** matter everywhere, especially with animals.

## Opposites
- The poem pairs **opposite** words: *big - small*, *loud - quiet*, *near - far*.
- **Opposites** are words with contrary meanings.
- More pairs: *tall - short*, *fast - slow*, *day - night*.

## The Story: Funny Bunny
- **Funny Bunny** is a rabbit who likes to play **jokes**.
- He hides the **carrots** of his friends and laughs at them.
- His friends are **sad**, and nobody wants to play with him.
- Funny Bunny says **sorry** and shares his own carrots.
- **Moral:** jokes should not hurt others; saying sorry repairs friendship.

## New Words
- **manners** - polite ways of behaving.
- **tease** - to make fun of someone in an unkind way.
- **joke** - something said to make people laugh.
- **apologise** - to say sorry.`,

  'Good Morning - Study Notes': `## The Poem: Good Morning
- The poem greets the **morning**: the sky, the sun, the birds and the trees.
- "**Good morning**" is repeated, so the poem sounds like a **greeting song**.
- The child wakes up and says good morning to everyone at home.
- The poem shows that a **kind greeting** starts the day well.

## Greetings
- Greetings: **Good morning, Good afternoon, Good evening, Good night**.
- We say "Good morning" from **morning until noon**.
- A greeting is a **polite** way to begin a conversation.

## The Story: The Magic Garden
- A **garden** is full of flowers, trees and birds.
- The **magic garden** gives flowers to children who are **kind** and **careful**.
- Children who **pluck** flowers without care find the garden empty.
- The garden teaches that **love and care** make beautiful things grow.
- **Moral:** we must take care of nature, and kindness is rewarded.

## New Words
- **greeting** - words we use when we meet someone.
- **garden** - a place where plants grow.
- **pluck** - to pick a flower or fruit.
- **reward** - something good given for good work.`,

  'Bird Talk - Study Notes': `## The Poem: Bird Talk
- Two **birds** talk to each other about the world of people.
- They wonder how people **live**, what they **eat** and why they **shout**.
- The birds think people are **strange** and noisy.
- The poem is funny because it looks at us from the **birds' point of view**.
- **Moral:** see the world from another's point of view.

## Rhyme
- Rhymes in the poem: *trees - these*, *say - day*.
- A poem has **stanzas** (groups of lines).
- Read the two stanzas aloud with a different **voice** for each bird.

## The Story: Nina and the Baby Sparrows
- **Nina** finds a **nest** with **baby sparrows** in her garden.
- She wants to keep them, but her mother explains that the **mother bird** will look after them best.
- Nina keeps water and grain near the nest and watches from far away.
- The baby birds grow and **fly away**.
- **Moral:** wild animals belong in nature; caring means giving them **space**.

## New Words
- **sparrow** - a small brown bird.
- **nest** - a home a bird builds for its eggs.
- **stanza** - a group of lines in a poem.
- **observe** - to watch carefully.`,

  'Little by Little - Study Notes': `## The Poem: Little by Little
- The poem shows how small things grow into big things.
- **Little by little** the acorn becomes an **oak tree**.
- **Little by little** the stream becomes a **river**.
- **Little by little** the child learns to read and write.
- **Moral:** **patience** and small daily steps bring big results.

## Small Steps
- Big work is done in **small parts**: one page a day, one sum a day.
- Words: **slowly, gradually, step by step, little by little**.
- "Little by little" answers the question **how**.

## The Story: The Enormous Turnip
- A farmer plants a **turnip** that grows **enormous**.
- He pulls and pulls, but it will not come out.
- He calls his **wife**, then the **boy**, then the **girl**, then the **dog**, then the **cat**, then the **mouse**.
- Together they pull, and out comes the turnip.
- **Moral:** **teamwork** succeeds where one person cannot.

## New Words
- **enormous** - very big.
- **turnip** - a round root vegetable.
- **pull** - to move something towards you.
- **together** - with others.`,

  'Sea Song - Study Notes': `## The Poem: Sea Song
- The poem is a **song about the sea**.
- The speaker hears the **waves**, the **wind** and the **gulls**.
- The sea is described as **deep, blue and wide**.
- The poem uses **imagination**: the sea can sing and call.
- **Moral:** nature is full of music if we listen.

## Imagination
- **Imagination** lets us picture things that are not in front of us.
- The poem **personifies** the sea - it gives the sea a voice, like a person.
- Imagine what the sea would say if it could talk.

## The Story: A Little Fish Story
- A **little fish** lives in a big pond with many other fish.
- One day it is caught in a **net** and cannot get free.
- A **big fish** pushes the net and the little fish escapes.
- The little fish learns to be **careful** and to **help** others.
- **Moral:** even small creatures can help; kindness returns.

## New Words
- **wave** - a moving ridge of water.
- **gull** - a sea bird.
- **net** - a mesh used to catch fish.
- **escape** - to get free.`,

  'The Balloon Man - Study Notes': `## The Poem: The Balloon Man
- A **balloon man** comes down the street with a big bunch of **balloons**.
- The balloons are **red, blue, green and yellow**.
- Children run after him and wish for a balloon.
- The poem repeats "**balloons, balloons**" for a happy rhythm.
- **Moral:** simple joys make children happy.

## Rhyme and Repetition
- Rhymes: *street - sweet*, *sky - high*, *blue - too*.
- **Repetition** is saying a word or line again for effect.
- Clap the beat of "balloons, balloons, balloons".

## The Story: The Yellow Butterfly
- A **yellow butterfly** flies from flower to flower.
- A child catches it in a **net** and keeps it in a **jar**.
- The butterfly stops moving; the child feels **sad**.
- The child opens the jar and the butterfly flies away.
- **Moral:** living things need **freedom**; love means letting go.

## New Words
- **balloon** - a rubber bag filled with air.
- **bunch** - a group of things held together.
- **butterfly** - an insect with large coloured wings.
- **freedom** - the right to move about freely.`,

  'Wake Up! - Study Notes': `## The Poem: Wake Up!
- The poem is a **morning call**: "Wake up, wake up!"
- It names what the child must do: **get up, wash, dress, eat** and go to school.
- The **sun** and the **birds** are already awake.
- The poem has a **command** tone, like a parent in the morning.
- **Moral:** a good **morning routine** keeps us ready for the day.

## Commands and Requests
- A **command** tells someone to do something: *Wake up! Brush your teeth!*
- A command begins with a **verb** and often ends with "!".
- A **request** is softer: *Please wake me up at six.*
- Use "**please**" and "**may I**" to make a request.

## The Story: Neha's Alarm Clock
- **Neha** cannot wake up in time, so her father buys her an **alarm clock**.
- The clock rings, but Neha **stops it** and sleeps again.
- She is **late** for school and misses her bus.
- Neha decides to **sleep early** and keep the clock away from her bed.
- **Moral:** **responsibility** means keeping our own promises.

## New Words
- **alarm clock** - a clock that rings at a set time.
- **routine** - things we do in the same order every day.
- **responsible** - doing your duty on your own.
- **late** - after the right time.`,

  'Noses - Study Notes': `## The Poem: Noses
- The poem is a **funny description of noses**.
- Noses come in many **shapes and sizes**: long, short, flat, pointed.
- The speaker wonders why a nose is in the **middle** of the face.
- The poem uses **rhyme** to make the list amusing.
- **Moral:** humour helps us accept how we look.

## Funny Faces
- Describe a face with **adjectives**: *long nose, round eyes, big ears, curly hair*.
- An **adjective** describes a noun.
- Order of adjectives: *a **long pointed** nose*.

## The Story: The Little Fir Tree
- A **fir tree** is unhappy because it is small and its needles are not pretty.
- It wishes for **gold leaves**, then **glass leaves**, then **green leaves** again.
- Each wish brings trouble: thieves steal the gold, the wind breaks the glass.
- In the end the fir tree is happy with its **own needles**, which stay green all year.
- **Moral:** be **careful what you wish for**; what we have is often best.

## New Words
- **fir tree** - a tree with needle-like leaves.
- **needles** - thin, sharp leaves of a fir tree.
- **wish** - a strong hope for something.
- **content** - happy with what one has.`,

  'Run! - Study Notes': `## The Poem: Run!
- The poem urges the reader to **run, jump, hop, skip and climb**.
- It names places to run: in the **sun**, in the **rain**, on the **road**, on the **grass**.
- **Movement words** give the poem its energy.
- The poem repeats "**Run!**" to push the reader to move.
- **Moral:** being **active** keeps us healthy and happy.

## Movement Words
- Verbs of movement: *run, jump, hop, skip, climb, crawl, swim, walk*.
- "Run in the sun" answers **where** and **how**.
- Say each movement word and act it out.

## The Story: Nasruddin's Aim
- **Nasruddin** is a funny, clever man in many folk tales.
- He shoots an **arrow** at a tree and then paints a **circle** around it.
- People think he is a great **archer**, but he explains that he aims **after** shooting.
- The story shows **wit** and makes fun of people who are fooled by **appearances**.
- **Moral:** do not be fooled by **clever tricks**; think for yourself.

## New Words
- **aim** - to point at a target.
- **archer** - a person who shoots with a bow and arrow.
- **target** - the thing you try to hit.
- **wit** - quick, clever thinking.`,

  'Why? - Study Notes': `## The Poem: Why?
- The poem is a list of a child's **questions** about the world.
- Why is the sky **blue**? Why do birds **sing**? Why does the moon **change shape**?
- Each stanza begins with "**Why**", so the poem sounds like a curious child.
- Some questions are **funny**, some are **serious**.
- **Moral:** **curiosity** is the beginning of learning.

## Questions
- A **question** ends with a **question mark (?)**.
- **WH-words**: what, why, when, where, who, which, how.
- "Why" asks for a **reason**; "how" asks about the **way**.
- Turn a statement into a question: *The sky is blue.* -> *Why is the sky blue?*

## The Story: Alice in Wonderland
- **Alice** follows a **white rabbit** with a **watch** and falls down a **rabbit hole**.
- She finds a strange world where **animals talk** and **size changes**.
- She meets the **Cheshire Cat**, the **Mad Hatter** and the **Queen of Hearts**.
- Alice stays **brave and polite** in a confusing place.
- **Moral:** **imagination** opens new worlds, and courage helps us explore them.

## New Words
- **curious** - eager to know something.
- **wonderland** - an imaginary land of wonders.
- **rabbit hole** - the tunnel where a rabbit lives.
- **imagination** - the power to picture new things.`,

  "Don't be Afraid of the Dark - Study Notes": `## The Poem: Don't be Afraid of the Dark
- The poem tells a child **not to fear the dark**.
- The dark is **quiet** and **calm**, not dangerous.
- The moon and stars **shine** at night, and the night is full of **soft sounds**.
- The poem says the dark is a **friend** that helps us **rest**.
- **Moral:** **fear** becomes small when we understand what we fear.

## Overcoming Fear
- Ways to feel brave: **switch on a small light**, **breathe slowly**, **think of happy things**, **call a parent**.
- Words: *brave, calm, safe, afraid, worried*.
- Say "I can be brave" out loud - it really helps.

## The Story: Helen Keller
- **Helen Keller** was a girl who could not **see or hear** after an illness in babyhood.
- She could not speak, and she was often **angry and lonely**.
- Her teacher, **Anne Sullivan**, taught her words by spelling them into her **hand**.
- The first word Helen understood was "**water**", felt on her hand at the pump.
- Helen learned to **read, write and speak**, and she helped many people.
- **Moral:** **courage and patience** can overcome the hardest difficulties.

## New Words
- **courage** - being brave when things are hard.
- **blind** - not able to see.
- **deaf** - not able to hear.
- **patient** - able to wait and keep trying calmly.`,
};

/** Four practice questions per chapter (2 MCQ, 2 written). */
type PrimaryQuestion = {
  grade: string;
  chapterName: string;
  spec: {
    type: 'MCQ' | 'SHORT_ANSWER';
    text: string;
    answer: string;
    marks: number;
    options?: { text: string; isCorrect: boolean }[];
  };
};

const mcq = (text: string, correct: string, wrong: string[]): PrimaryQuestion['spec'] => ({
  type: 'MCQ',
  text,
  answer: correct,
  marks: 1,
  options: [correct, ...wrong].map((option) => ({ text: option, isCorrect: option === correct })),
});

const short = (text: string, answer: string): PrimaryQuestion['spec'] => ({
  type: 'SHORT_ANSWER',
  text,
  answer,
  marks: 2,
});

export const PRIMARY_ENGLISH_QUESTIONS: PrimaryQuestion[] = [
  {
    grade: '1',
    chapterName: 'A Happy Child',
    spec: mcq('What colour is the house in the poem "A Happy Child"?', 'Red and white', ['Blue and green', 'Yellow and brown', 'Black and grey']),
  },
  {
    grade: '1',
    chapterName: 'A Happy Child',
    spec: mcq('Which house did the wolf NOT blow down?', 'The house of bricks', ['The house of straw', 'The house of sticks', 'All three houses']),
  },
  {
    grade: '1',
    chapterName: 'A Happy Child',
    spec: short('Why could the wolf not blow down the brick house?', 'Because the brick house was strong - the third pig built it slowly and carefully.'),
  },
  {
    grade: '1',
    chapterName: 'A Happy Child',
    spec: short('Write one pair of rhyming words from the poem.', 'white - bright (or day - play)'),
  },
  {
    grade: '1',
    chapterName: 'After a Bath',
    spec: mcq('What does the child in the poem use after a bath?', 'A towel', ['A brush', 'A cap', 'A pillow']),
  },
  {
    grade: '1',
    chapterName: 'After a Bath',
    spec: mcq('Who became friends and went into the forest?', 'The bubble, the straw and the shoe', ['The cat, the rat and the bat', 'The pig, the dog and the hen', 'The kite, the ball and the drum']),
  },
  {
    grade: '1',
    chapterName: 'After a Bath',
    spec: short('Why did the bubble burst in the story?', 'Because the straw broke and the bubble fell into the water.'),
  },
  {
    grade: '1',
    chapterName: 'After a Bath',
    spec: short('Name any two action words (verbs) from the poem.', 'dry, rub (also wash, comb)'),
  },
  {
    grade: '1',
    chapterName: 'One Little Kitten',
    spec: mcq('Which animal says "mew"?', 'Kitten', ['Dog', 'Cow', 'Goat']),
  },
  {
    grade: '1',
    chapterName: 'One Little Kitten',
    spec: mcq('What did Lalu eat at first?', 'Only yellow food', ['Only green food', 'Only red food', 'Only sweet food']),
  },
  {
    grade: '1',
    chapterName: 'One Little Kitten',
    spec: short('What did Lalu learn from Peelu?', 'That he should eat many kinds of food, not just yellow food.'),
  },
  {
    grade: '1',
    chapterName: 'One Little Kitten',
    spec: short('Count and write the number names from one to five.', 'one, two, three, four, five'),
  },
  {
    grade: '1',
    chapterName: 'Once I Saw a Little Bird',
    spec: mcq('Where was the little bird sitting?', 'At the window', ['On a tree', 'In a nest', 'On the roof']),
  },
  {
    grade: '1',
    chapterName: 'Once I Saw a Little Bird',
    spec: mcq('Who helped Mittu get the yellow mango?', 'His friends', ['The farmer', 'The wind', 'Nobody']),
  },
  {
    grade: '1',
    chapterName: 'Once I Saw a Little Bird',
    spec: short('What did the little bird do when the speaker asked it to stop?', 'It said no and flew away.'),
  },
  {
    grade: '1',
    chapterName: 'Once I Saw a Little Bird',
    spec: short('Why did Mittu share the mango?', 'Because his friends helped him reach it and sharing makes everyone happy.'),
  },
  {
    grade: '1',
    chapterName: 'Merry-Go-Round',
    spec: mcq('How does a merry-go-round move?', 'Round and round', ['Up and down only', 'In a straight line', 'Backwards only']),
  },
  {
    grade: '1',
    chapterName: 'Merry-Go-Round',
    spec: mcq('Which of these is a circle?', 'A wheel', ['A book', 'A box', 'A door']),
  },
  {
    grade: '1',
    chapterName: 'Merry-Go-Round',
    spec: short('Name two things in your home that are round.', 'A plate and a bangle (also a coin, a wheel, a clock).'),
  },
  {
    grade: '1',
    chapterName: 'Merry-Go-Round',
    spec: short('Why can a circle roll but a square cannot?', 'Because a circle has no corners, while a square has four corners.'),
  },

  {
    grade: '2',
    chapterName: 'First Day at School',
    spec: mcq('How does the child feel on the first day of school?', 'Nervous at first, then happy', ['Angry all day', 'Sleepy all day', 'Bored all day']),
  },
  {
    grade: '2',
    chapterName: 'First Day at School',
    spec: mcq('Who did Haldi meet on her way?', 'A duck, a cat and a cow', ['A lion and a tiger', 'Two birds and a fish', 'A monkey and a bear']),
  },
  {
    grade: '2',
    chapterName: 'First Day at School',
    spec: short('Name two feelings the child has on the first day of school.', 'nervous and happy (also shy, excited)'),
  },
  {
    grade: '2',
    chapterName: 'First Day at School',
    spec: short('What did Haldi do when she came home?', 'She told her mother everything about her adventure.'),
  },
  {
    grade: '2',
    chapterName: 'I am Lucky',
    spec: mcq('Which word in the poem shows ability?', 'can', ['cannot', 'never', 'maybe']),
  },
  {
    grade: '2',
    chapterName: 'I am Lucky',
    spec: mcq('Which of these is a need, not a want?', 'Water', ['A toy car', 'A balloon', 'An ice cream']),
  },
  {
    grade: '2',
    chapterName: 'I am Lucky',
    spec: short('Write two things you can do well.', 'Any two abilities, e.g. I can swim. I can sing.'),
  },
  {
    grade: '2',
    chapterName: 'I am Lucky',
    spec: short('Why should we say "please" when we ask for something?', 'Because polite words show good manners and people like to help us.'),
  },
  {
    grade: '2',
    chapterName: 'A Smile',
    spec: mcq('What does a smile cost?', 'Nothing', ['One rupee', 'A lot of money', 'A gift']),
  },
  {
    grade: '2',
    chapterName: 'A Smile',
    spec: mcq('What made the traveller take off his coat?', 'The warm sun', ['The strong wind', 'The rain', 'A friend']),
  },
  {
    grade: '2',
    chapterName: 'A Smile',
    spec: short('What is the moral of "The Wind and the Sun"?', 'Gentleness wins where force fails.'),
  },
  {
    grade: '2',
    chapterName: 'A Smile',
    spec: short('Write two words that rhyme with "smile".', 'while, mile (also tile)'),
  },
  {
    grade: '2',
    chapterName: 'Rain',
    spec: mcq('Which sound word is used for rain in the poem?', 'pitter-patter', ['bang-bang', 'tick-tock', 'ding-dong']),
  },
  {
    grade: '2',
    chapterName: 'Rain',
    spec: mcq('What protects a squirrel during the storm?', 'A big tree', ['A house', 'An umbrella', 'A rock']),
  },
  {
    grade: '2',
    chapterName: 'Rain',
    spec: short('Name two things we use on a rainy day.', 'An umbrella and a raincoat (also boots).'),
  },
  {
    grade: '2',
    chapterName: 'Rain',
    spec: short('How does rain help farmers?', 'It waters the crops and helps them grow.'),
  },
  {
    grade: '2',
    chapterName: 'Zoo Manners',
    spec: mcq('What should we NOT do at the zoo?', 'Tease the animals', ['Watch quietly', 'Speak softly', 'Walk with our parents']),
  },
  {
    grade: '2',
    chapterName: 'Zoo Manners',
    spec: mcq('Which pair are opposites?', 'loud - quiet', ['big - large', 'happy - glad', 'fast - quick']),
  },
  {
    grade: '2',
    chapterName: 'Zoo Manners',
    spec: short('Why did Funny Bunny say sorry?', 'Because his jokes made his friends sad and nobody wanted to play with him.'),
  },
  {
    grade: '2',
    chapterName: 'Zoo Manners',
    spec: short('Write two rules of good manners at the zoo.', 'Do not tease or feed the animals; watch them quietly.'),
  },

  {
    grade: '3',
    chapterName: 'Good Morning',
    spec: mcq('When do we say "Good morning"?', 'From morning until noon', ['At night', 'In the evening only', 'After dinner']),
  },
  {
    grade: '3',
    chapterName: 'Good Morning',
    spec: mcq('Who finds the magic garden empty?', 'Children who pluck flowers carelessly', ['Children who water the plants', 'The gardener', 'The birds']),
  },
  {
    grade: '3',
    chapterName: 'Good Morning',
    spec: short('Write two greetings we use during the day.', 'Good morning, good afternoon (also good evening).'),
  },
  {
    grade: '3',
    chapterName: 'Good Morning',
    spec: short('What is the moral of "The Magic Garden"?', 'We must take care of nature, and kindness is rewarded.'),
  },
  {
    grade: '3',
    chapterName: 'Bird Talk',
    spec: mcq('What do the birds in the poem talk about?', 'How people live', ['Where to build nests', 'What to eat', 'How to fly']),
  },
  {
    grade: '3',
    chapterName: 'Bird Talk',
    spec: mcq('What did Nina keep near the nest?', 'Water and grain', ['Milk and bread', 'A cage', 'Nothing']),
  },
  {
    grade: '3',
    chapterName: 'Bird Talk',
    spec: short('Why did Nina not keep the baby sparrows in a cage?', 'Because wild birds belong in nature and their mother bird looks after them best.'),
  },
  {
    grade: '3',
    chapterName: 'Bird Talk',
    spec: short('What is a stanza?', 'A group of lines in a poem.'),
  },
  {
    grade: '3',
    chapterName: 'Little by Little',
    spec: mcq('What does the acorn become?', 'An oak tree', ['A rose bush', 'A river', 'A mountain']),
  },
  {
    grade: '3',
    chapterName: 'Little by Little',
    spec: mcq('Who pulled the turnip first?', 'The farmer', ['The mouse', 'The cat', 'The girl']),
  },
  {
    grade: '3',
    chapterName: 'Little by Little',
    spec: short('What does "little by little" mean?', 'Slowly, in small steps, until something big is done.'),
  },
  {
    grade: '3',
    chapterName: 'Little by Little',
    spec: short('What is the moral of "The Enormous Turnip"?', 'Teamwork succeeds where one person cannot.'),
  },
  {
    grade: '3',
    chapterName: 'Sea Song',
    spec: mcq('What does the poem call the sea?', 'A place that can sing', ['A desert', 'A mountain', 'A city']),
  },
  {
    grade: '3',
    chapterName: 'Sea Song',
    spec: mcq('Who helps the little fish escape from the net?', 'A big fish', ['A bird', 'A boat', 'A boy']),
  },
  {
    grade: '3',
    chapterName: 'Sea Song',
    spec: short('Name two things you can hear near the sea.', 'Waves and gulls (also the wind).'),
  },
  {
    grade: '3',
    chapterName: 'Sea Song',
    spec: short('What is the moral of "A Little Fish Story"?', 'Even small creatures can help, and kindness returns.'),
  },
  {
    grade: '3',
    chapterName: 'The Balloon Man',
    spec: mcq('What colours are the balloons?', 'Red, blue, green and yellow', ['Only red', 'Only black and white', 'Only purple']),
  },
  {
    grade: '3',
    chapterName: 'The Balloon Man',
    spec: mcq('Why did the child open the jar?', 'To set the butterfly free', ['To catch another butterfly', 'To give it food', 'To show it to a friend']),
  },
  {
    grade: '3',
    chapterName: 'The Balloon Man',
    spec: short('Why do children run after the balloon man?', 'Because they love the colourful balloons and want one.'),
  },
  {
    grade: '3',
    chapterName: 'The Balloon Man',
    spec: short('What is the moral of "The Yellow Butterfly"?', 'Living things need freedom; love means letting go.'),
  },

  {
    grade: '4',
    chapterName: 'Wake Up!',
    spec: mcq('Which of these is a command?', 'Wake up!', ['Could you please wake me?', 'I woke up early.', 'May I wake up?']),
  },
  {
    grade: '4',
    chapterName: 'Wake Up!',
    spec: mcq('Why was Neha late for school?', 'She stopped the alarm and slept again', ['Her bus was late', 'She forgot her bag', 'She was ill']),
  },
  {
    grade: '4',
    chapterName: 'Wake Up!',
    spec: short('Write two things you do every morning before school.', 'Any two: wake up, brush my teeth, have breakfast, wear my uniform.'),
  },
  {
    grade: '4',
    chapterName: 'Wake Up!',
    spec: short('What did Neha learn from being late?', 'That she must be responsible, sleep early and wake up when the alarm rings.'),
  },
  {
    grade: '4',
    chapterName: 'Noses',
    spec: mcq('The poem "Noses" is about...', 'different shapes of noses', ['how to smell flowers', 'a trip to the doctor', 'a pet dog']),
  },
  {
    grade: '4',
    chapterName: 'Noses',
    spec: mcq('What did the fir tree finally keep?', 'Its own green needles', ['Gold leaves', 'Glass leaves', 'Paper leaves']),
  },
  {
    grade: '4',
    chapterName: 'Noses',
    spec: short('Why were the gold leaves of the fir tree a problem?', 'Because thieves stole them.'),
  },
  {
    grade: '4',
    chapterName: 'Noses',
    spec: short('What is the moral of "The Little Fir Tree"?', 'Be careful what you wish for; what we have is often best.'),
  },
  {
    grade: '4',
    chapterName: 'Run!',
    spec: mcq('The poem "Run!" tells us to...', 'be active and move about', ['sit quietly all day', 'sleep early', 'eat more sweets']),
  },
  {
    grade: '4',
    chapterName: 'Run!',
    spec: mcq('How did Nasruddin become famous as an archer?', 'He painted the target after shooting', ['He practised every day', 'He used a magic arrow', 'He never missed']),
  },
  {
    grade: '4',
    chapterName: 'Run!',
    spec: short('Name four movement words from the poem.', 'run, jump, hop, skip (also climb, crawl).'),
  },
  {
    grade: '4',
    chapterName: 'Run!',
    spec: short('What does the story of Nasruddin teach us?', 'Do not be fooled by clever tricks; think for yourself.'),
  },
  {
    grade: '4',
    chapterName: 'Why?',
    spec: mcq('Which word asks for a reason?', 'Why', ['When', 'Where', 'Who']),
  },
  {
    grade: '4',
    chapterName: 'Why?',
    spec: mcq('What did Alice follow into the rabbit hole?', 'A white rabbit with a watch', ['A cat', 'A bird', 'A boy']),
  },
  {
    grade: '4',
    chapterName: 'Why?',
    spec: short('Write two "why" questions of your own.', 'Any two sensible questions, e.g. Why is the sky blue? Why do birds sing?'),
  },
  {
    grade: '4',
    chapterName: 'Why?',
    spec: short('What is the moral of the Alice in Wonderland story?', 'Imagination opens new worlds, and courage helps us explore them.'),
  },
  {
    grade: '4',
    chapterName: "Don't be Afraid of the Dark",
    spec: mcq('According to the poem, the dark is...', 'quiet and calm', ['always dangerous', 'full of monsters', 'very noisy']),
  },
  {
    grade: '4',
    chapterName: "Don't be Afraid of the Dark",
    spec: mcq('Which word did Helen Keller first understand?', 'water', ['mother', 'tree', 'book']),
  },
  {
    grade: '4',
    chapterName: "Don't be Afraid of the Dark",
    spec: short('Name two ways to feel brave in the dark.', 'Switch on a small light; breathe slowly (or think of happy things).'),
  },
  {
    grade: '4',
    chapterName: "Don't be Afraid of the Dark",
    spec: short('Who was Helen Keller and who helped her learn?', 'A girl who could not see or hear; her teacher Anne Sullivan helped her.'),
  },
];

/**
 * Question text -> concept name, the map the seed uses to attach a question to a
 * concept. Primary questions belong to the chapter's first concept (the same one
 * the video lesson is attached to).
 */
export const PRIMARY_ENGLISH_QUESTION_CONCEPTS: Record<string, string> = Object.fromEntries(
  PRIMARY_ENGLISH_QUESTIONS.map((entry) => {
    const chapter = (PRIMARY_ENGLISH_CURRICULUM[entry.grade] ?? []).find(
      (candidate) => candidate.name === entry.chapterName,
    );
    const concept = chapter?.topics[0]?.concepts[0];
    if (!concept) throw new Error(`Primary English question has no chapter: ${entry.chapterName}`);
    return [entry.spec.text, concept];
  }),
);

