const fs = require('fs');
const path = require('path');

const CLASSES = {
  5: 'class-5',
  6: 'class-6',
  7: 'class-7',
  10: 'class-10',
  8: 'class-8',
  9: 'class-9',
};

function classDir(cls) {
  const dir = CLASSES[String(cls)];
  if (!dir) throw new Error(`unknown class "${cls}" (known: ${Object.keys(CLASSES).join(', ')})`);
  return path.join(__dirname, '..', '..', 'books', 'cbse', dir);
}

const SUBJECTS = {
  science: {
    slug: 'science',
    // class 5 is the EVS book ("Our Wondrous World"), kept on disk as `world`
    dirs: { 5: 'world' },
    label: 'Science',
    editions: {
      10: 'NCERT Science Textbook for Class X, Reprint 2026-27',
      9: 'NCERT Exploration: Textbook of Science for Grade 9, First Edition April 2026',
      7: 'NCERT Curiosity: Textbook of Science for Grade 7, Reprint 2026-27',
    },
    chapters: {
      7: [
        ['gecu1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['gecu101.pdf', '01-the-ever-evolving-world-of-science', 'The Ever-Evolving World of Science'],
        ['gecu102.pdf', '02-exploring-substances-acidic-basic-and-neutral', 'Exploring Substances: Acidic, Basic, and Neutral'],
        ['gecu103.pdf', '03-electricity-circuits-and-their-components', 'Electricity: Circuits and their Components'],
        ['gecu104.pdf', '04-the-world-of-metals-and-non-metals', 'The World of Metals and Non-metals'],
        ['gecu105.pdf', '05-changes-around-us-physical-and-chemical', 'Changes Around Us: Physical and Chemical'],
        ['gecu106.pdf', '06-adolescence-a-stage-of-growth-and-change', 'Adolescence: A Stage of Growth and Change'],
        ['gecu107.pdf', '07-heat-transfer-in-nature', 'Heat Transfer in Nature'],
        ['gecu108.pdf', '08-measurement-of-time-and-motion', 'Measurement of Time and Motion'],
        ['gecu109.pdf', '09-life-processes-in-animals', 'Life Processes in Animals'],
        ['gecu110.pdf', '10-life-processes-in-plants', 'Life Processes in Plants'],
        ['gecu111.pdf', '11-light-shadows-and-reflections', 'Light: Shadows and Reflections'],
        ['gecu112.pdf', '12-earth-moon-and-the-sun', 'Earth, Moon, and the Sun'],
      ],
      6: [
        ['fecu1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['fecu101.pdf', '01-the-wonderful-world-of-science', 'The Wonderful World of Science'],
        ['fecu102.pdf', '02-diversity-in-the-living-world', 'Diversity in the Living World'],
        ['fecu103.pdf', '03-mindful-eating-a-path-to-a-healthy-body', 'Mindful Eating: A Path to a Healthy Body'],
        ['fecu104.pdf', '04-exploring-magnets', 'Exploring Magnets'],
        ['fecu105.pdf', '05-measurement-of-length-and-motion', 'Measurement of Length and Motion'],
        ['fecu106.pdf', '06-materials-around-us', 'Materials Around Us'],
        ['fecu107.pdf', '07-temperature-and-its-measurement', 'Temperature and its Measurement'],
        ['fecu108.pdf', '08-a-journey-through-states-of-water', 'A Journey through States of Water'],
        ['fecu109.pdf', '09-methods-of-separation-in-everyday-life', 'Methods of Separation in Everyday Life'],
        ['fecu110.pdf', '10-living-creatures-exploring-their-characteristics', 'Living Creatures: Exploring their Characteristics'],
        ['fecu111.pdf', '11-natures-treasures', "Nature's Treasures"],
        ['fecu112.pdf', '12-beyond-earth', 'Beyond Earth'],
      ],
      5: [
        ['eeev1ps.pdf', '00-prelims', 'Front matter (foreword, about the textbook, contents)'],
        ['eeev101.pdf', '01-water-the-essence-of-life', 'Water - The Essence of Life'],
        ['eeev102.pdf', '02-journey-of-a-river', 'Journey of a River'],
        ['eeev103.pdf', '03-the-mystery-of-food', 'The Mystery of Food'],
        ['eeev104.pdf', '04-our-school-a-happy-place', 'Our School - A Happy Place'],
        ['eeev105.pdf', '05-our-vibrant-country', 'Our Vibrant Country'],
        ['eeev106.pdf', '06-some-unique-places', 'Some Unique Places'],
        ['eeev107.pdf', '07-energy-how-things-work', 'Energy - How Things Work'],
        ['eeev108.pdf', '08-clothes-how-things-are-made', 'Clothes - How Things are Made'],
        ['eeev109.pdf', '09-rhythms-of-nature', 'Rhythms of Nature'],
        ['eeev110.pdf', '10-earth-our-shared-home', 'Earth - Our Shared Home'],
      ],
      10: [
        ['jesc1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents, committees)'],
        ['jesc101.pdf', '01-chemical-reactions-and-equations', 'Chemical Reactions and Equations'],
        ['jesc102.pdf', '02-acids-bases-and-salts', 'Acids, Bases and Salts'],
        ['jesc103.pdf', '03-metals-and-non-metals', 'Metals and Non-metals'],
        ['jesc104.pdf', '04-carbon-and-its-compounds', 'Carbon and its Compounds'],
        ['jesc105.pdf', '05-life-processes', 'Life Processes'],
        ['jesc106.pdf', '06-control-and-coordination', 'Control and Coordination'],
        ['jesc107.pdf', '07-how-do-organisms-reproduce', 'How do Organisms Reproduce?'],
        ['jesc108.pdf', '08-heredity', 'Heredity'],
        ['jesc109.pdf', '09-light-reflection-and-refraction', 'Light - Reflection and Refraction'],
        ['jesc110.pdf', '10-the-human-eye-and-the-colourful-world', 'The Human Eye and the Colourful World'],
        ['jesc111.pdf', '11-electricity', 'Electricity'],
        ['jesc112.pdf', '12-magnetic-effects-of-electric-current', 'Magnetic Effects of Electric Current'],
        ['jesc113.pdf', '13-our-environment', 'Our Environment'],
        ['jesc1an.pdf', '99-answers', 'Answers to Exercises'],
      ],
      8: [
        ['hecu1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['hecu101.pdf', '01-exploring-the-investigative-world-of-science', 'Exploring the Investigative World of Science'],
        ['hecu102.pdf', '02-the-invisible-living-world', 'The Invisible Living World: Beyond Our Naked Eye'],
        ['hecu103.pdf', '03-health-the-ultimate-treasure', 'Health: The Ultimate Treasure'],
        ['hecu104.pdf', '04-electricity-magnetic-and-heating-effects', 'Electricity: Magnetic and Heating Effects'],
        ['hecu105.pdf', '05-exploring-forces', 'Exploring Forces'],
        ['hecu106.pdf', '06-pressure-winds-storms-and-cyclones', 'Pressure, Winds, Storms, and Cyclones'],
        ['hecu107.pdf', '07-particulate-nature-of-matter', 'Particulate Nature of Matter'],
        ['hecu108.pdf', '08-nature-of-matter-elements-compounds-mixtures', 'Nature of Matter: Elements, Compounds, and Mixtures'],
        ['hecu109.pdf', '09-solutes-solvents-and-solutions', 'The Amazing World of Solutes, Solvents, and Solutions'],
        ['hecu110.pdf', '10-light-mirrors-and-lenses', 'Light: Mirrors and Lenses'],
        ['hecu111.pdf', '11-keeping-time-with-the-skies', 'Keeping Time with the Skies'],
        ['hecu112.pdf', '12-how-nature-works-in-harmony', 'How Nature Works in Harmony'],
        ['hecu113.pdf', '13-our-home-earth', 'Our Home: Earth, a Unique Life Sustaining Planet'],
      ],
      9: [
        ['iesc1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents, committees)'],
        ['iesc101.pdf', '01-exploration-entering-the-world-of-secondary-science', 'Exploration: Entering the World of Secondary Science'],
        ['iesc102.pdf', '02-cell-the-building-block-of-life', 'Cell: The Building Block of Life'],
        ['iesc103.pdf', '03-tissues-in-action', 'Tissues in Action'],
        ['iesc104.pdf', '04-describing-motion-around-us', 'Describing Motion Around Us'],
        ['iesc105.pdf', '05-exploring-mixtures-and-their-separation', 'Exploring Mixtures and their Separation'],
        ['iesc106.pdf', '06-how-forces-affect-motion', 'How Forces Affect Motion'],
        ['iesc107.pdf', '07-work-energy-and-simple-machines', 'Work, Energy, and Simple Machines'],
        ['iesc108.pdf', '08-journey-inside-the-atom', 'Journey Inside the Atom'],
        ['iesc109.pdf', '09-atomic-foundations-of-matter', 'Atomic Foundations of Matter'],
        ['iesc110.pdf', '10-sound-waves-characteristics-and-applications', 'Sound Waves: Characteristics and Applications'],
        ['iesc111.pdf', '11-reproduction-how-life-continues', 'Reproduction: How Life Continues'],
        ['iesc112.pdf', '12-patterns-in-life-diversity-and-classification', 'Patterns in Life: Diversity and Classification'],
        ['iesc113.pdf', '13-earth-as-a-system-energy-matter-and-life', 'Earth as a System: Energy, Matter, and Life (with Answer Key)'],
      ],
    },
  },
  mathematics: {
    slug: 'mathematics',
    // the on-disk folder for this class differs from the canonical slug
    dirs: { 5: 'math', 6: 'math', 7: 'math 1', 8: 'math part 1', 9: 'math' },
    label: 'Mathematics',
    editions: {
      10: 'NCERT Mathematics Textbook for Class X',
      9: 'NCERT Ganita Manjari: Textbook of Mathematics for Grade 9, Part I, First Edition April 2026',
      7: 'NCERT Ganita Prakash: Textbook of Mathematics for Grade 7, Part I, Reprint 2026-27',
      6: 'NCERT Ganita Prakash: Textbook of Mathematics for Grade 6',
      5: 'NCERT Mathematics Textbook for Grade 5, Reprint 2026-27',
    },
    chapters: {
      5: [
        ['eemm1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['eemm101.pdf', '01-we-the-travellers-1', 'We the Travellers - I'],
        ['eemm102.pdf', '02-fractions', 'Fractions'],
        ['eemm103.pdf', '03-angles-as-turns', 'Angles as Turns'],
        ['eemm104.pdf', '04-we-the-travellers-2', 'We the Travellers - II'],
        ['eemm105.pdf', '05-far-and-near', 'Far and Near'],
        ['eemm106.pdf', '06-the-dairy-farm', 'The Dairy Farm'],
        ['eemm107.pdf', '07-shapes-and-patterns', 'Shapes and Patterns'],
        ['eemm108.pdf', '08-weight-and-capacity', 'Weight and Capacity'],
        ['eemm109.pdf', '09-coconut-farm', 'Coconut Farm'],
        ['eemm110.pdf', '10-symmetrical-designs', 'Symmetrical Designs'],
        ['eemm111.pdf', '11-grandmothers-quilt', "Grandmother's Quilt"],
        ['eemm112.pdf', '12-racing-seconds', 'Racing Seconds'],
        ['eemm113.pdf', '13-animal-jumps', 'Animal Jumps'],
        ['eemm114.pdf', '14-maps-and-locations', 'Maps and Locations'],
        ['eemm115.pdf', '15-data-through-pictures', 'Data Through Pictures'],
      ],
      6: [
        ['fegp1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['fegp101.pdf', '01-patterns-in-mathematics', 'Patterns in Mathematics'],
        ['fegp102.pdf', '02-lines-and-angles', 'Lines and Angles'],
        ['fegp103.pdf', '03-number-play', 'Number Play'],
        ['fegp104.pdf', '04-data-handling-and-presentation', 'Data Handling and Presentation'],
        ['fegp105.pdf', '05-prime-time', 'Prime Time'],
        ['fegp106.pdf', '06-perimeter-and-area', 'Perimeter and Area'],
        ['fegp107.pdf', '07-fractions', 'Fractions'],
        ['fegp108.pdf', '08-playing-with-constructions', 'Playing with Constructions'],
        ['fegp109.pdf', '09-symmetry', 'Symmetry'],
        ['fegp110.pdf', '10-the-other-side-of-zero', 'The Other Side of Zero'],
      ],
      7: [
        ['gegp1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['gegp101.pdf', '01-large-numbers-around-us', 'Large Numbers Around Us'],
        ['gegp102.pdf', '02-arithmetic-expressions', 'Arithmetic Expressions'],
        ['gegp103.pdf', '03-a-peek-beyond-the-point', 'A Peek Beyond the Point'],
        ['gegp104.pdf', '04-expressions-using-letter-numbers', 'Expressions using Letter-Numbers'],
        ['gegp105.pdf', '05-parallel-and-intersecting-lines', 'Parallel and Intersecting Lines'],
        ['gegp106.pdf', '06-number-play', 'Number Play'],
        ['gegp107.pdf', '07-a-tale-of-three-intersecting-lines', 'A Tale of Three Intersecting Lines'],
        ['gegp108.pdf', '08-working-with-fractions', 'Working with Fractions'],
      ],
      10: [
        ['jemh1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['jemh101.pdf', '01-real-numbers', 'Real Numbers'],
        ['jemh102.pdf', '02-polynomials', 'Polynomials'],
        ['jemh103.pdf', '03-pair-of-linear-equations-in-two-variables', 'Pair of Linear Equations in Two Variables'],
        ['jemh104.pdf', '04-quadratic-equations', 'Quadratic Equations'],
        ['jemh105.pdf', '05-arithmetic-progressions', 'Arithmetic Progressions'],
        ['jemh106.pdf', '06-triangles', 'Triangles'],
        ['jemh107.pdf', '07-coordinate-geometry', 'Coordinate Geometry'],
        ['jemh108.pdf', '08-introduction-to-trigonometry', 'Introduction to Trigonometry'],
        ['jemh109.pdf', '09-some-applications-of-trigonometry', 'Some Applications of Trigonometry'],
        ['jemh110.pdf', '10-circles', 'Circles'],
        ['jemh111.pdf', '11-areas-related-to-circles', 'Areas Related to Circles'],
        ['jemh112.pdf', '12-surface-areas-and-volumes', 'Surface Areas and Volumes'],
        ['jemh113.pdf', '13-statistics', 'Statistics'],
        ['jemh114.pdf', '14-probability', 'Probability'],
      ],

      8: [
        ['hegp1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['hegp101.pdf', '01-a-square-and-a-cube', 'A Square and A Cube'],
        ['hegp102.pdf', '02-power-play', 'Power Play'],
        ['hegp103.pdf', '03-a-story-of-numbers', 'A Story of Numbers'],
        ['hegp104.pdf', '04-quadrilaterals', 'Quadrilaterals'],
        ['hegp105.pdf', '05-number-play', 'Number Play'],
        ['hegp106.pdf', '06-we-distribute-yet-things-multiply', 'We Distribute, Yet Things Multiply'],
        ['hegp107.pdf', '07-proportional-reasoning-1', 'Proportional Reasoning-1'],
      ],
      9: [
        ['iemh1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents, committees)'],
        ['iemh101.pdf', '01-orienting-yourself-the-use-of-coordinates', 'Orienting Yourself: The Use of Coordinates'],
        ['iemh102.pdf', '02-introduction-to-linear-polynomials', 'Introduction to Linear Polynomials'],
        ['iemh103.pdf', '03-the-world-of-numbers', 'The World of Numbers'],
        ['iemh104.pdf', '04-exploring-algebraic-identities', 'Exploring Algebraic Identities'],
        ['iemh105.pdf', '05-im-up-and-down-and-round-and-round', "I'm Up and Down, and Round and Round"],
        ['iemh106.pdf', '06-measuring-space-perimeter-and-area', 'Measuring Space: Perimeter and Area'],
        ['iemh107.pdf', '07-the-mathematics-of-maybe-introduction-to-probability', 'The Mathematics of Maybe: Introduction to Probability'],
        ['iemh108.pdf', '08-predicting-what-comes-next-exploring-sequences-and-progressions', 'Predicting What Comes Next: Exploring Sequences and Progressions (with Graph Paper)'],
      ],
    },
  },
  // "Ganita Prakash" volume 2 (chapters 1-7, numbered independently of volume 1)
  'mathematics-part2': {
    slug: 'mathematics-part2',
    label: 'Mathematics (Part 2)',
    dirs: { 7: 'math 2', 8: 'math part 2' },
    editions: {
      8: 'NCERT Mathematics Textbook for Grade 8, Part-II (Ganita Prakash)',
      7: 'NCERT Ganita Prakash: Textbook of Mathematics for Grade 7, Part II, Reprint 2026-27',
    },
    chapters: {
      7: [
        ['gegp2ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['gegp201.pdf', '01-geometric-twins', 'Geometric Twins'],
        ['gegp202.pdf', '02-operations-with-integers', 'Operations with Integers'],
        ['gegp203.pdf', '03-finding-common-ground', 'Finding Common Ground'],
        ['gegp204.pdf', '04-another-peek-beyond-the-point', 'Another Peek Beyond the Point'],
        ['gegp205.pdf', '05-connecting-the-dots', 'Connecting the Dots...'],
        ['gegp206.pdf', '06-constructions-and-tilings', 'Constructions and Tilings'],
        ['gegp207.pdf', '07-finding-the-unknown', 'Finding the Unknown'],
      ],
      8: [
        ['hegp2ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['hegp201.pdf', '01-fractions-in-disguise', 'Fractions in Disguise'],
        ['hegp202.pdf', '02-baudhayana-pythagoras-theorem', 'The Baudhayana-Pythagoras Theorem'],
        ['hegp203.pdf', '03-proportional-reasoning-2', 'Proportional Reasoning-2'],
        ['hegp204.pdf', '04-exploring-some-geometric-themes', 'Exploring Some Geometric Themes'],
        ['hegp205.pdf', '05-tales-by-dots-and-lines', 'Tales by Dots and Lines'],
        ['hegp206.pdf', '06-algebra-play', 'Algebra Play'],
        ['hegp207.pdf', '07-area', 'Area'],
      ],
    },
  },

  english: {
    slug: 'english',
    label: 'English',
    editions: {
      10: 'NCERT English Core Textbook for Class X (First Flight), Reprint 2026-27',
      9: 'NCERT Kaveri: Textbook of English for Grade 9, First Edition January 2026',
      7: 'NCERT Poorvi: Textbook of English for Grade 7, Reprint 2026-27',
      6: 'NCERT Poorvi: Textbook of English for Grade 6',
      5: 'NCERT English Textbook for Grade 5, Reprint 2026-27',
    },
    chapters: {
      5: [
        ['eesa1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['eesa101.pdf', '01-papas-spectacles', "Papa's Spectacles"],
        ['eesa102.pdf', '02-gone-with-the-scooter', 'Gone with the Scooter'],
        ['eesa103.pdf', '03-the-rainbow', 'The Rainbow'],
        ['eesa104.pdf', '04-the-wise-parrot', 'The Wise Parrot'],
        ['eesa105.pdf', '05-the-frog', 'The Frog'],
        ['eesa106.pdf', '06-what-a-tank', 'What a Tank!'],
        ['eesa107.pdf', '07-gilli-danda', 'Gilli Danda'],
        ['eesa108.pdf', '08-the-decision-of-the-panchayat', 'The Decision of the Panchayat'],
        ['eesa109.pdf', '09-vocation', 'Vocation'],
        ['eesa110.pdf', '10-glass-bangles', 'Glass Bangles'],
      ],
      6: [
        ['fepr1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['fepr101.pdf', '01-fables-and-folk-tales', 'Fables and Folk Tales'],
        ['fepr102.pdf', '02-friendship', 'Friendship'],
        ['fepr103.pdf', '03-nurturing-nature', 'Nurturing Nature'],
        ['fepr104.pdf', '04-sports-and-wellness', 'Sports and Wellness'],
        ['fepr105.pdf', '05-culture-and-tradition', 'Culture and Tradition'],
      ],
      7: [
        ['gepr1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents)'],
        ['gepr101.pdf', '01-learning-together', 'Learning Together'],
        ['gepr102.pdf', '02-wit-and-humour', 'Wit and Humour'],
        ['gepr103.pdf', '03-dreams-and-discoveries', 'Dreams and Discoveries'],
        ['gepr104.pdf', '04-travel-and-adventure', 'Travel and Adventure'],
        ['gepr105.pdf', '05-bravehearts', 'Bravehearts'],
      ],
      10: [
        ['jeff1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['jeff101.pdf', '01-a-letter-to-god', 'A Letter to God'],
        ['jeff102.pdf', '02-nelson-mandela-long-walk-to-freedom', 'Nelson Mandela: Long Walk to Freedom'],
        ['jeff103.pdf', '03-two-stories-about-flying', 'Two Stories about Flying (I: The Flying Machine, II: The Seagull)'],
        ['jeff104.pdf', '04-from-the-diary-of-anne-frank', 'From the Diary of Anne Frank'],
        ['jeff105.pdf', '05-glimpses-of-india', 'Glimpses of India'],
        ['jeff106.pdf', '06-mijbil-the-otter', 'Mijbil the Otter'],
        ['jeff107.pdf', '07-madam-rides-the-bus', 'Madam Rides the Bus'],
        ['jeff108.pdf', '08-the-sermon-at-benares', 'The Sermon at Benares'],
        ['jeff109.pdf', '09-the-proposal', 'The Proposal'],
      ],

      8: [
        ['hepr1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents)'],
        ['hepr101.pdf', '01-wit-and-wisdom', 'Wit and Wisdom'],
        ['hepr102.pdf', '02-values-and-dispositions', 'Values and Dispositions'],
        ['hepr103.pdf', '03-mystery-and-magic', 'Mystery and Magic'],
        ['hepr104.pdf', '04-environment', 'Environment'],
        ['hepr105.pdf', '05-science-and-curiosity', 'Science and Curiosity'],
      ],
      9: [
        ['iebe1ps.pdf', '00-prelims', 'Front matter (foreword, about the book, contents, committees)'],
        ['iebe101.pdf', '01-how-i-taught-my-grandmother-to-read', 'How I Taught My Grandmother to Read'],
        ['iebe102.pdf', '02-the-pot-maker', 'The Pot Maker'],
        ['iebe103.pdf', '03-winds-of-change', 'Winds of Change'],
        ['iebe104.pdf', '04-vitamin-m', 'Vitamin-M'],
        ['iebe105.pdf', '05-the-world-of-limitless-possibilities', 'The World of Limitless Possibilities'],
        ['iebe106.pdf', '06-twin-melodies', 'Twin Melodies'],
        ['iebe107.pdf', '07-carrier-of-words', 'Carrier of Words'],
        ['iebe108.pdf', '08-follow-that-dream', 'Follow That Dream'],
        ['iebe1a1.pdf', '99-appendix', 'Appendix (Audio Transcripts â€” Listen and Respond)'],
      ],
    },
  },
};

function argOf(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

/**
 * Resolve a subject of a class: its root folder, the folder holding the source PDFs
 * (some subjects keep them in `source/`, others in the subject folder itself) and the
 * chapter list for that class.
 */
function resolveSubject(name, cls = 10) {
  const subject = SUBJECTS[name];
  if (!subject) {
    throw new Error(`unknown subject "${name}" (known: ${Object.keys(SUBJECTS).join(', ')})`);
  }
  const classNumber = Number(cls);
  const folder = subject.dirs?.[classNumber] ?? subject.slug;
  const root = path.join(classDir(classNumber), folder);
  if (!fs.existsSync(root)) throw new Error(`subject folder not found: ${root}`);
  const source = fs.existsSync(path.join(root, 'source')) ? path.join(root, 'source') : root;
  const chapters = subject.chapters[classNumber] ?? [];
  return {
    ...subject,
    classNumber,
    classDirName: CLASSES[String(classNumber)],
    folder,
    root,
    source,
    chaptersDir: path.join(root, 'chapters'),
    chapters,
    edition: subject.editions[classNumber] ?? subject.editions[10],
  };
}

module.exports = { CLASSES, CLASS_DIR: classDir, SUBJECTS, resolveSubject, argOf };
