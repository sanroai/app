// env-loader must be imported before @prisma/client so that shell-exported
// environment is observed before Prisma auto-loads apps/api/.env.
import { loadApiEnv, resolveTargetUrl, parseTarget, isLocalHost } from './env-loader';
import { seedSystem } from './seed-system';
import { DEMO_PASSWORD } from '../src/common/demo-password';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedArContent } from './seed-ar';

loadApiEnv();

type SeedMode = 'system' | 'demo' | 'qa';

function resolveMode(argv: string[]): SeedMode {
  if (argv.includes('--qa')) return 'qa';
  if (argv.includes('--demo')) return 'demo';
  if (argv.includes('--system')) return 'system';
  return 'system';
}

const MODE: SeedMode = resolveMode(process.argv.slice(2));
const TARGET_URL = resolveTargetUrl(MODE === 'qa');

const prisma = new PrismaClient(TARGET_URL ? { datasources: { db: { url: TARGET_URL } } } : undefined);

const HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

type ChapterSpec = {
  name: string;
  code: string;
  topics: { name: string; concepts: string[] }[];
};

const SCIENCE = 'Science';
const MATHS = 'Mathematics';
const ENGLISH = 'English';

const CURRICULUM: Record<string, Record<string, ChapterSpec[]>> = {
  '1': {
    [SCIENCE]: [
      {
        name: 'Plants and Animals',
        code: 'SCI-1-1',
        topics: [
          { name: 'Parts of a Plant', concepts: ['Root, Stem, Leaves', 'Flowers and Fruits'] },
          { name: 'Animal Homes', concepts: ['Domestic Animals', 'Wild Animals'] },
        ],
      },
      {
        name: 'Our Body and Food',
        code: 'SCI-1-2',
        topics: [
          { name: 'Parts of the Body', concepts: ['Senses', 'Movement'] },
          { name: 'Food We Need', concepts: ['Fruits and Vegetables', 'Balanced Diet'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Numbers up to 100',
        code: 'MAT-1-1',
        topics: [
          { name: 'Counting and Comparing', concepts: ['Before and After', 'Greater and Smaller'] },
          { name: 'Addition and Subtraction', concepts: ['Single Digit', 'Double Digit'] },
        ],
      },
      {
        name: 'Shapes and Patterns',
        code: 'MAT-1-2',
        topics: [
          { name: 'Basic Shapes', concepts: ['Circle, Square, Triangle', 'Rectangle'] },
          { name: 'Patterns', concepts: ['Number Patterns', 'Shape Patterns'] },
        ],
      },
    ],
  },
  '2': {
    [SCIENCE]: [
      {
        name: 'Plants Around Us',
        code: 'SCI-2-1',
        topics: [
          { name: 'Types of Plants', concepts: ['Trees, Shrubs, Herbs', 'Parts of a Flower'] },
          { name: 'Plant Needs', concepts: ['Sunlight and Water', 'Soil'] },
        ],
      },
      {
        name: 'Animals and Their Young',
        code: 'SCI-2-2',
        topics: [
          { name: 'Life Cycles', concepts: ['Egg to Adult', 'Metamorphosis'] },
          { name: 'Animal Families', concepts: ['Mothers and Babies', 'Group Names'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Numbers up to 1000',
        code: 'MAT-2-1',
        topics: [
          { name: 'Place Value', concepts: ['Hundreds, Tens, Ones', 'Expanded Form'] },
          { name: 'Addition and Subtraction', concepts: ['Three Digit Numbers', 'Carrying and Borrowing'] },
        ],
      },
      {
        name: 'Introduction to Multiplication',
        code: 'MAT-2-2',
        topics: [
          { name: 'Groups of Objects', concepts: ['Repeated Addition', 'Times Table 2, 5, 10'] },
          { name: 'Simple Problems', concepts: ['Array Model', 'Word Problems'] },
        ],
      },
    ],
  },
  '3': {
    [SCIENCE]: [
      {
        name: 'The World of Plants',
        code: 'SCI-3-1',
        topics: [
          { name: 'How Plants Grow', concepts: ['Germination', 'Parts and Functions'] },
          { name: 'Plants and Us', concepts: ['Food from Plants', 'Medicinal Plants'] },
        ],
      },
      {
        name: 'The Human Body',
        code: 'SCI-3-2',
        topics: [
          { name: 'Skeleton System', concepts: ['Bones and Joints', 'Movement'] },
          { name: 'Digestion', concepts: ['Mouth to Stomach', 'Teeth and Chewing'] },
        ],
      },
      {
        name: 'Properties of Materials',
        code: 'SCI-3-3',
        topics: [
          { name: 'Solids and Liquids', concepts: ['Hard and Soft', 'Transparent and Opaque'] },
          { name: 'Sorting Materials', concepts: ['By Shape', 'By Use'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Numbers up to 10000',
        code: 'MAT-3-1',
        topics: [
          { name: 'Place Value', concepts: ['Thousands and Hundreds', 'Comparing Numbers'] },
          { name: 'Roman Numerals', concepts: ['I to L', 'Basic Rules'] },
        ],
      },
      {
        name: 'Multiplication and Division',
        code: 'MAT-3-2',
        topics: [
          { name: 'Multiplication', concepts: ['Two Digit Numbers', 'Properties'] },
          { name: 'Division', concepts: ['Simple Division', 'Remainder'] },
        ],
      },
    ],
  },
  '4': {
    [SCIENCE]: [
      {
        name: 'Food and Nutrition',
        code: 'SCI-4-1',
        topics: [
          { name: 'Components of Food', concepts: ['Carbohydrates, Proteins, Fats', 'Vitamins and Minerals'] },
          { name: 'Balanced Diet', concepts: ['Food Groups', 'Malnutrition'] },
        ],
      },
      {
        name: 'The Living World',
        code: 'SCI-4-2',
        topics: [
          { name: 'Habitats', concepts: ['Land and Water Habitats', 'Adaptation'] },
          { name: 'Food Chains', concepts: ['Producers and Consumers', 'Decomposers'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Large Numbers',
        code: 'MAT-4-1',
        topics: [
          { name: 'Numbers up to Lakhs', concepts: ['Place Value', 'Indian System'] },
          { name: 'Estimation', concepts: ['Rounding Off', 'Word Problems'] },
        ],
      },
      {
        name: 'Operations on Numbers',
        code: 'MAT-4-2',
        topics: [
          { name: 'Addition and Subtraction', concepts: ['Multi-digit', 'Properties'] },
          { name: 'Multiplication and Division', concepts: ['Word Problems', 'Patterns'] },
        ],
      },
    ],
  },
  '5': {
    [SCIENCE]: [
      {
        name: 'The World of Living Things',
        code: 'SCI-5-1',
        topics: [
          { name: 'Life Cycles', concepts: ['Butterfly, Frog, Plant', 'Metamorphosis'] },
          { name: 'Ecosystems', concepts: ['Pond Life', 'Forest Life'] },
        ],
      },
      {
        name: 'Materials: Pure and Mixed',
        code: 'SCI-5-2',
        topics: [
          { name: 'Separation Methods', concepts: ['Filtration, Evaporation', 'Sieving'] },
          { name: 'Properties', concepts: ['Conductors and Insulators', 'Magnetic Materials'] },
        ],
      },
      {
        name: 'Forces and Energy',
        code: 'SCI-5-3',
        topics: [
          { name: 'Simple Machines', concepts: ['Lever, Pulley, Inclined Plane'] },
          { name: 'Light and Shadows', concepts: ['Rectilinear Propagation', 'Pinhole Camera'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Numbers and Operations',
        code: 'MAT-5-1',
        topics: [
          { name: 'Large Numbers', concepts: ['Numbers up to Crores', 'Place Value'] },
          { name: 'Operations', concepts: ['HCF and LCM', 'Order of Operations'] },
        ],
      },
      {
        name: 'Fractions and Decimals',
        code: 'MAT-5-2',
        topics: [
          { name: 'Fractions', concepts: ['Addition and Subtraction', 'Mixed Numbers'] },
          { name: 'Decimals', concepts: ['Tenths and Hundredths', 'Money'] },
        ],
      },
      {
        name: 'Geometry and Mensuration',
        code: 'MAT-5-3',
        topics: [
          { name: '3D Shapes', concepts: ['Cube, Cuboid, Cylinder', 'Sphere'] },
          { name: 'Area and Volume', concepts: ['Rectangle and Square', 'Simple Formulas'] },
        ],
      },
    ],
  },
  '6': {
    [SCIENCE]: [
      {
        name: 'The World of the Living',
        code: 'SCI-6-1',
        topics: [
          { name: 'Classification of Living Things', concepts: ['Kingdoms', 'Vertebrates and Invertebrates'] },
          { name: 'Plant Classification', concepts: ['Flowering and Non-flowering', 'Leaf Shapes'] },
        ],
      },
      {
        name: 'Body Movements',
        code: 'SCI-6-2',
        topics: [
          { name: 'Skeletal System', concepts: ['Bones and Muscles', 'Joint Types'] },
          { name: 'Movement in Animals', concepts: ['Swimming, Walking, Flying'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Basic Geometrical Ideas',
        code: 'MAT-6-1',
        topics: [
          { name: 'Points, Lines, Planes', concepts: ['Line Segments', 'Rays'] },
          { name: 'Angles', concepts: ['Measuring Angles', 'Types of Angles'] },
        ],
      },
      {
        name: 'Integers',
        code: 'MAT-6-2',
        topics: [
          { name: 'Positive and Negative Numbers', concepts: ['Number Line', 'Addition'] },
          { name: 'Operations', concepts: ['Subtraction', 'Word Problems'] },
        ],
      },
      {
        name: 'Algebra',
        code: 'MAT-6-3',
        topics: [
          { name: 'Variables and Expressions', concepts: ['Using Letters', 'Simple Equations'] },
          { name: 'Patterns', concepts: ['Number Patterns', 'Visual Patterns'] },
        ],
      },
    ],
  },
  '7': {
    [SCIENCE]: [
      {
        name: 'Nutrition in Living Organisms',
        code: 'SCI-7-1',
        topics: [
          { name: 'How Plants Make Food', concepts: ['Photosynthesis', 'Chlorophyll'] },
          { name: 'Digestion in Humans', concepts: ['Alimentary Canal', 'Enzymes'] },
        ],
      },
      {
        name: 'Heat and Temperature',
        code: 'SCI-7-2',
        topics: [
          { name: 'Heat Transfer', concepts: ['Conduction, Convection, Radiation'] },
          { name: 'Temperature Measurement', concepts: ['Thermometer', 'Body Temperature'] },
        ],
      },
      {
        name: 'Electric Current and Circuits',
        code: 'SCI-7-3',
        topics: [
          { name: 'Electric Circuit', concepts: ['Components', 'Series and Parallel'] },
          { name: 'Conductors and Insulators', concepts: ['Materials', 'Safety'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Integers and Fractions',
        code: 'MAT-7-1',
        topics: [
          { name: 'Integer Operations', concepts: ['Multiplication and Division', 'Properties'] },
          { name: 'Rational Numbers', concepts: ['Comparing', 'Operations'] },
        ],
      },
      {
        name: 'Linear Equations',
        code: 'MAT-7-2',
        topics: [
          { name: 'Simple Equations', concepts: ['Solving for Unknown', 'Word Problems'] },
          { name: 'Transposing', concepts: ['Moving Terms', 'Checking Solutions'] },
        ],
      },
      {
        name: 'Geometry',
        code: 'MAT-7-3',
        topics: [
          { name: 'Triangles', concepts: ['Types by Angles', 'Angle Sum Property'] },
          { name: 'Perimeter and Area', concepts: ['Rectangle, Square, Triangle', 'Composite Shapes'] },
        ],
      },
    ],
  },
  '8': {
    
    [ENGLISH]: [
      {
        name: 'Wit and Wisdom',
        code: 'ENG-8-1',
        topics: [
          {
            name: 'Tenali Rama and the Vijayanagara Court',
            concepts: [
              'The Wit that Won Hearts',
              'Tenali Rama and the Paddy Seeds',
            ],
          },
          {
            name: 'Poetry, Drama and Language',
            concepts: [
              '‘A Concrete Example’ by Reginald Arkell',
              'The Play ‘Wisdom Paves the Way’ and Modals',
            ],
          },
        ],
      },
      {
        name: 'Values and Dispositions',
        code: 'ENG-8-2',
        topics: [
          {
            name: 'Courage, Sacrifice and Kindness',
            concepts: [
              'Major Somnath Sharma and the Battle of Badgam',
              '‘Somebody’s Mother’ — Kindness and Empathy',
            ],
          },
          {
            name: 'Service to Society and Language Skills',
            concepts: [
              'Verghese Kurien — I Too Had a Dream',
              'Subject–Verb Agreement, Dashes and Prepositional Phrases',
            ],
          },
        ],
      },
      {
        name: 'Mystery and Magic',
        code: 'ENG-8-3',
        topics: [
          {
            name: 'Detective Reasoning',
            concepts: [
              '‘The Case of the Fifth Word’ by Donald J. Sobol',
              'Critical Thinking and Close Observation',
            ],
          },
          {
            name: 'Creativity and Natural Wonders',
            concepts: [
              '‘The Magic Brush of Dreams’ — a Folk Tale',
              '‘Spectacular Wonders’ of India',
            ],
          },
        ],
      },
      {
        name: 'Environment',
        code: 'ENG-8-4',
        topics: [
          {
            name: 'Nature, Patience and the Harvest',
            concepts: [
              '‘The Cherry Tree’ by Ruskin Bond',
              '‘Harvest Hymn’ by Sarojini Naidu',
            ],
          },
          {
            name: 'Farming, Seasons and Language',
            concepts: [
              '‘Waiting for the Rain’ by Kamakshi Balasubramanian',
              'Determiners, Adjectives and the Chipko Movement',
            ],
          },
        ],
      },
      {
        name: 'Science and Curiosity',
        code: 'ENG-8-5',
        topics: [
          {
            name: 'Space, Friendship and Perception',
            concepts: [
              '‘Feathered Friend’ by Arthur C. Clarke',
              '‘Magnifying Glass’ by Walter de la Mare',
            ],
          },
          {
            name: 'Indian Women in Science',
            concepts: [
              'Bibha Chowdhuri — The Beam of Light',
              'Word Formation and the Active Voice',
            ],
          },
        ],
      },
    ],
    [SCIENCE]: [
      {
        name: 'Exploring the Investigative World of Science',
        code: 'SCI-8-1',
        topics: [
          {
            name: 'Asking Questions and Framing an Investigation',
            concepts: [
              'Asking a Scientific Question',
              'Controlled Variables in an Experiment',
            ],
          },
          {
            name: 'Observation, Measurement and Recording',
            concepts: [
              'Careful Observation',
              'Recording Data and Making Sense of It',
            ],
          },
        ],
      },
      {
        name: 'The Invisible Living World: Beyond Our Naked Eye',
        code: 'SCI-8-2',
        topics: [
          {
            name: 'The Cell as the Basic Unit of Life',
            concepts: [
              'Cell Membrane, Cytoplasm and Nucleus',
              'Cell Wall, Plastids and Vacuole',
            ],
          },
          {
            name: 'Levels of Organisation and Microorganisms',
            concepts: [
              'Levels of Organisation from Cell to Organism',
              'Microorganisms and the Work They Do',
            ],
          },
        ],
      },
      {
        name: 'Health: The Ultimate Treasure',
        code: 'SCI-8-3',
        topics: [
          {
            name: 'What Health Means and How to Keep It',
            concepts: [
              'Physical, Mental and Social Well-being',
              'Healthy Lifestyle and a Clean Environment',
            ],
          },
          {
            name: 'Diseases, Immunity and Treatment',
            concepts: [
              'Communicable and Non-communicable Diseases',
              'Vaccines, Antibiotics and Antibiotic Resistance',
            ],
          },
        ],
      },
      {
        name: 'Electricity: Magnetic and Heating Effects',
        code: 'SCI-8-4',
        topics: [
          {
            name: 'Magnetic Effect of Electric Current',
            concepts: [
              'Oersted’s Discovery and the Magnetic Field',
              'Electromagnets and Lifting Electromagnets',
            ],
          },
          {
            name: 'Heating Effect and Cells',
            concepts: [
              'Heating Effect of Electric Current and Resistance',
              'Voltaic Cell, Dry Cell and Rechargeable Batteries',
            ],
          },
        ],
      },
      {
        name: 'Exploring Forces',
        code: 'SCI-8-5',
        topics: [
          {
            name: 'Force and Its Effects',
            concepts: [
              'Push and Pull: What a Force Can Do',
              'Contact and Non-contact Forces',
            ],
          },
          {
            name: 'Weight, Mass and Buoyancy',
            concepts: [
              'Weight versus Mass',
              'Upthrust, Floating and Sinking',
            ],
          },
        ],
      },
      {
        name: 'Pressure, Winds, Storms, and Cyclones',
        code: 'SCI-8-6',
        topics: [
          {
            name: 'Pressure and Atmospheric Pressure',
            concepts: [
              'Pressure as Force per Unit Area',
              'Atmospheric Pressure',
            ],
          },
          {
            name: 'Winds, Storms and Cyclones',
            concepts: [
              'Formation of Wind and High-speed Winds',
              'Thunderstorms, Lightning and Cyclones',
            ],
          },
        ],
      },
      {
        name: 'Particulate Nature of Matter',
        code: 'SCI-8-7',
        topics: [
          {
            name: 'Matter is Made of Tiny Particles',
            concepts: [
              'Constituent Particles of Matter',
              'Interparticle Spaces and Attractions',
            ],
          },
          {
            name: 'The Three States of Matter',
            concepts: [
              'Solid, Liquid and Gaseous States',
              'Melting Point and Boiling Point',
            ],
          },
        ],
      },
      {
        name: 'Nature of Matter: Elements, Compounds, and Mixtures',
        code: 'SCI-8-8',
        topics: [
          {
            name: 'Mixtures and Pure Substances',
            concepts: [
              'Uniform and Non-uniform Mixtures',
              'Pure Substances and Their Separation',
            ],
          },
          {
            name: 'Elements, Compounds and Minerals',
            concepts: [
              'Elements and Their Properties',
              'Compounds Formed in Fixed Ratios',
            ],
          },
        ],
      },
      {
        name: 'The Amazing World of Solutes, Solvents, and Solutions',
        code: 'SCI-8-9',
        topics: [
          {
            name: 'Solutions, Solutes and Solvents',
            concepts: [
              'Solute, Solvent and Solution',
              'Saturated, Unsaturated, Dilute and Concentrated',
            ],
          },
          {
            name: 'Solubility and Density',
            concepts: [
              'Solubility and the Effect of Temperature',
              'Density and Floating or Sinking',
            ],
          },
        ],
      },
      {
        name: 'Light: Mirrors and Lenses',
        code: 'SCI-8-10',
        topics: [
          {
            name: 'Spherical Mirrors and Images',
            concepts: [
              'Concave and Convex Mirrors',
              'Laws of Reflection',
            ],
          },
          {
            name: 'Lenses and the Path of Light',
            concepts: [
              'Convex and Concave Lenses',
              'Converging and Diverging Light',
            ],
          },
        ],
      },
      {
        name: 'Keeping Time with the Skies',
        code: 'SCI-8-11',
        topics: [
          {
            name: 'The Moon and Its Phases',
            concepts: [
              'Phases of the Moon',
              'Waxing and Waning Periods',
            ],
          },
          {
            name: 'Calendars and Measuring Time',
            concepts: [
              'Lunar, Solar and Luni-solar Calendars',
              'The Solar Day, the Month and the Year',
            ],
          },
        ],
      },
      {
        name: 'How Nature Works in Harmony',
        code: 'SCI-8-12',
        topics: [
          {
            name: 'Habitats, Populations and Communities',
            concepts: [
              'Biotic and Abiotic Components',
              'Population, Community and Ecosystem',
            ],
          },
          {
            name: 'Interactions in Nature',
            concepts: [
              'Interactions Among Organisms',
              'Food Chains, Decomposition and Balance',
            ],
          },
        ],
      },
      {
        name: 'Our Home: Earth, a Unique Life Sustaining Planet',
        code: 'SCI-8-13',
        topics: [
          {
            name: 'Why Earth is a Unique Planet',
            concepts: [
              'Position, Size and the Habitable Zone',
              'Atmosphere, Ozone Layer and Magnetic Field',
            ],
          },
          {
            name: 'Life Sustained and Threats to Life',
            concepts: [
              'Resources That Sustain Life on Earth',
              'Reproduction and Threats to Life on Earth',
            ],
          },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'A Square and A Cube',
        code: 'MAT-8-1',
        topics: [
          {
            name: 'Square Numbers',
            concepts: [
              'Perfect Squares',
              'Patterns of Squares and Square Roots',
            ],
          },
          {
            name: 'Cubic Numbers',
            concepts: [
              'Perfect Cubes and Cube Roots',
              'Taxicab Numbers',
            ],
          },
        ],
      },
      {
        name: 'Power Play',
        code: 'MAT-8-2',
        topics: [
          {
            name: 'Exponential Notation',
            concepts: [
              'Powers and Exponential Form',
              'Laws of Exponents',
            ],
          },
          {
            name: 'Negative Powers and Powers of 10',
            concepts: [
              'Zero and Negative Exponents',
              'Powers of 10 and Scientific Notation',
            ],
          },
        ],
      },
      {
        name: 'A Story of Numbers',
        code: 'MAT-8-3',
        topics: [
          {
            name: 'Early Number Systems',
            concepts: [
              'Tally Marks and Counting in Groups',
              'Roman Numerals',
            ],
          },
          {
            name: 'The Idea of a Base and Place Value',
            concepts: [
              'Base-n Number Systems',
              'Place Value Representation and the Abacus',
            ],
          },
        ],
      },
      {
        name: 'Quadrilaterals',
        code: 'MAT-8-4',
        topics: [
          {
            name: 'Rectangles and Squares',
            concepts: [
              'Properties of a Rectangle',
              'Angles of a Quadrilateral',
            ],
          },
          {
            name: 'More Quadrilaterals',
            concepts: [
              'Parallelogram and Rhombus',
              'Kite and Trapezium',
            ],
          },
        ],
      },
      {
        name: 'Number Play',
        code: 'MAT-8-5',
        topics: [
          {
            name: 'Multiples and Divisibility',
            concepts: [
              'Factors and Multiples',
              'Remainders and Divisibility',
            ],
          },
          {
            name: 'Divisibility Shortcuts and Digit Tricks',
            concepts: [
              'Divisibility by 3, 9 and 11',
              'Digits in Disguise',
            ],
          },
        ],
      },
      {
        name: 'We Distribute, Yet Things Multiply',
        code: 'MAT-8-6',
        topics: [
          {
            name: 'Distributivity and Identities',
            concepts: [
              'Distributive Property of Multiplication',
              'Algebraic Identities',
            ],
          },
          {
            name: 'Special Cases of Multiplication',
            concepts: [
              'How a Product Increases or Decreases',
              'This Way or That Way, All Ways Lead to the Bay',
            ],
          },
        ],
      },
      {
        name: 'Proportional Reasoning-1',
        code: 'MAT-8-7',
        topics: [
          {
            name: 'Similarity in Change and Ratios',
            concepts: [
              'Proportional Change',
              'Ratios in their Simplest Form',
            ],
          },
          {
            name: 'Solving Problems with Ratios',
            concepts: [
              'Problem Solving with Proportional Reasoning',
              'Sharing, but Not Equally, and Unit Conversions',
            ],
          },
        ],
      },
      {
        name: 'Fractions in Disguise',
        code: 'MAT-8P2-1',
        topics: [
          {
            name: 'Fractions as Percentages',
            concepts: [
              'Expressing Fractions as Percentages',
              'The FDP Trio: Fractions, Decimals and Percentages',
            ],
          },
          {
            name: 'Percentage Problems in Real Life',
            concepts: [
              'Percentage of a Quantity',
              'Percentage Increase, Decrease, Profit and Loss',
            ],
          },
        ],
      },
      {
        name: 'The Baudhayana-Pythagoras Theorem',
        code: 'MAT-8P2-2',
        topics: [
          {
            name: 'Doubling and Halving a Square',
            concepts: [
              'Doubling a Square',
              'Halving a Square',
            ],
          },
          {
            name: 'The Theorem and Its Uses',
            concepts: [
              'Baudhayana’s Theorem on Right-angled Triangles',
              'Hypotenuse of an Isosceles Right Triangle',
            ],
          },
        ],
      },
      {
        name: 'Proportional Reasoning-2',
        code: 'MAT-8P2-3',
        topics: [
          {
            name: 'Ratios in the Real World',
            concepts: [
              'Representative Fraction and Ratios in Maps',
              'Ratios with More than Two Terms',
            ],
          },
          {
            name: 'Sharing a Whole and Inverse Proportions',
            concepts: [
              'Dividing a Whole in a Given Ratio',
              'Inverse Proportions',
            ],
          },
        ],
      },
      {
        name: 'Exploring Some Geometric Themes',
        code: 'MAT-8P2-4',
        topics: [
          {
            name: 'Fractals',
            concepts: [
              'Sierpinski Carpet and Sierpinski Gasket',
              'Koch Snowflake and Fractals in Art',
            ],
          },
          {
            name: 'Visualising Solids',
            concepts: [
              'Nets, Unfolding and the Shortest Path',
              'Projections: Front, Top and Side Views',
            ],
          },
        ],
      },
      {
        name: 'Tales by Dots and Lines',
        code: 'MAT-8P2-5',
        topics: [
          {
            name: 'The Mean and the Median',
            concepts: [
              'Mean as the Balance Point',
              'How Changing Values Moves the Mean',
            ],
          },
          {
            name: 'Reading Data Visually',
            concepts: [
              'Line Graphs and Trends',
              'Infographics and Interpretation',
            ],
          },
        ],
      },
      {
        name: 'Algebra Play',
        code: 'MAT-8P2-6',
        topics: [
          {
            name: 'Algebraic Tricks and Puzzles',
            concepts: [
              '‘Think of a Number’ Tricks',
              'Number Pyramids',
            ],
          },
          {
            name: 'Grids, Products and Divisibility',
            concepts: [
              'Calendar Magic and Algebra Grids',
              'The Largest Product and Decoding Divisibility Tricks',
            ],
          },
        ],
      },
      {
        name: 'Area',
        code: 'MAT-8P2-7',
        topics: [
          {
            name: 'Area of Rectangles, Squares and Triangles',
            concepts: [
              'Area of a Rectangle and a Square',
              'Area of a Triangle',
            ],
          },
          {
            name: 'Area of Other Polygons',
            concepts: [
              'Area of a Parallelogram',
              'Area of a Rhombus and a Trapezium',
            ],
          },
        ],
      },
    ],
  },
  '9': {
    
    [ENGLISH]: [
      {
        name: 'How I Taught My Grandmother to Read',
        code: 'ENG-9-1',
        topics: [
          {
            name: 'Prose: How I Taught My Grandmother to Read',
            concepts: [
              'Literacy and Self-Worth',
              'Learning at Any Age',
            ],
          },
          {
            name: 'Poem: Bharat Our Land',
            concepts: [
              'Bharat Our Land',
              'Patriotic Imagery',
            ],
          },
        ],
      },
      {
        name: 'The Pot Maker',
        code: 'ENG-9-2',
        topics: [
          {
            name: 'Prose: The Pot Maker',
            concepts: [
              'Determination and Skill',
              'Craftsmanship and Vocation',
            ],
          },
          {
            name: 'Poem: Gifts of Grace: Honouring Our Vocations',
            concepts: [
              'Gifts of Grace: Honouring Our Vocations',
              'Dignity of Labour',
            ],
          },
        ],
      },
      {
        name: 'Winds of Change',
        code: 'ENG-9-3',
        topics: [
          {
            name: 'Prose: Winds of Change',
            concepts: [
              'Indigenous Craft of the Pankha',
              'Heritage and Change',
            ],
          },
          {
            name: 'Poem: Canvas of Soil',
            concepts: [
              'Canvas of Soil',
              'Gardening as Art',
            ],
          },
        ],
      },
      {
        name: 'Vitamin-M',
        code: 'ENG-9-4',
        topics: [
          {
            name: 'Prose: Vitamin-M',
            concepts: [
              'Caring for the Elderly',
              'Dignity and Independence',
            ],
          },
          {
            name: 'Poem: I Cannot Remember My Mother',
            concepts: [
              'I Cannot Remember My Mother',
              'Sensory Memory and Absence',
            ],
          },
        ],
      },
      {
        name: 'The World of Limitless Possibilities',
        code: 'ENG-9-5',
        topics: [
          {
            name: 'Prose: The World of Limitless Possibilities',
            concepts: [
              'Paralympics and Resilience',
              'Empathy, Sympathy and Compassion',
            ],
          },
          {
            name: 'Poem: Nine Gold Medals',
            concepts: [
              'Nine Gold Medals',
              'Solidarity over Competition',
            ],
          },
        ],
      },
      {
        name: 'Twin Melodies',
        code: 'ENG-9-6',
        topics: [
          {
            name: 'Prose: Twin Melodies',
            concepts: [
              'Play: Tradition Meets Innovation',
              'Classical and Contemporary Music',
            ],
          },
          {
            name: 'Poem: A Friend Found in Music',
            concepts: [
              'A Friend Found in Music',
              'Music as Consolation',
            ],
          },
        ],
      },
      {
        name: 'Carrier of Words',
        code: 'ENG-9-7',
        topics: [
          {
            name: 'Prose: Carrier of Words',
            concepts: [
              'Gramin Dak Sewak',
              'Words, Trust and Service',
            ],
          },
          {
            name: 'Poem: Words',
            concepts: [
              'Words',
              'Few Words, How Dear',
            ],
          },
        ],
      },
      {
        name: 'Follow That Dream',
        code: 'ENG-9-8',
        topics: [
          {
            name: 'Prose: Follow That Dream',
            concepts: [
              'Letter from a Mother',
              'Dreams and Self-Belief',
            ],
          },
          {
            name: 'Poem: Believe in Yourself',
            concepts: [
              'Believe in Yourself',
              'The First Step Is the Hardest',
            ],
          },
        ],
      },
    ],
    [SCIENCE]: [
      {
        name: 'Exploration: Entering the World of Secondary Science',
        code: 'SCI-9-1',
        topics: [
          {
            name: 'Models and the Language of Science',
            concepts: [
              'Models and Simplification',
              'Symbols, Units and Mathematics in Science',
            ],
          },
          {
            name: 'Laws, Theories, Predictions and Estimation',
            concepts: [
              'Laws, Theories and Principles',
              'Prediction, Reasoning and Estimation',
            ],
          },
        ],
      },
      {
        name: 'Cell: The Building Block of Life',
        code: 'SCI-9-2',
        topics: [
          {
            name: 'Studying Cells and Their Structure',
            concepts: [
              'Microscopes, Magnification and Cell Size',
              'Cell Membrane, Cell Wall and Cell Organelles',
            ],
          },
          {
            name: 'Cell Division and Cell Theory',
            concepts: [
              'Mitosis, Meiosis and Cell Division',
              'Cell Theory: The Unifying Principle of Biology',
            ],
          },
        ],
      },
      {
        name: 'Tissues in Action',
        code: 'SCI-9-3',
        topics: [
          {
            name: 'Plant Tissues: Meristem and Permanent Tissues',
            concepts: [
              'Meristematic Tissues in Plants',
              'Permanent Tissues and Plant vs Animal Tissues',
            ],
          },
          {
            name: 'Animal Tissues, Muscles and Joints',
            concepts: [
              'Epithelial, Connective, Muscular and Nervous Tissues',
              'Types of Joints and the Skeletal System',
            ],
          },
        ],
      },
      {
        name: 'Describing Motion Around Us',
        code: 'SCI-9-4',
        topics: [
          {
            name: 'Describing Motion in a Straight Line',
            concepts: [
              'Position, Distance and Displacement',
              'Average Speed, Average Velocity and Acceleration',
            ],
          },
          {
            name: 'Graphs, Kinematics and Motion in a Plane',
            concepts: [
              'Position-Time and Velocity-Time Graphs',
              'Kinematic Equations and Uniform Circular Motion',
            ],
          },
        ],
      },
      {
        name: 'Exploring Mixtures and their Separation',
        code: 'SCI-9-5',
        topics: [
          {
            name: 'Classifying Mixtures and Solutions',
            concepts: [
              'Homogeneous and Heterogeneous Mixtures',
              'Concentration and Solubility',
            ],
          },
          {
            name: 'Separating the Components of Mixtures',
            concepts: [
              'Crystallization, Distillation and Chromatography',
              'Immiscible Liquids, Sublimation, Suspensions and Colloids',
            ],
          },
        ],
      },
      {
        name: 'How Forces Affect Motion',
        code: 'SCI-9-6',
        topics: [
          {
            name: 'Force and Friction',
            concepts: [
              'Concept of Force',
              'Force of Friction',
            ],
          },
          {
            name: 'Newton\'s Laws of Motion',
            concepts: [
              'Newton\'s First Law of Motion',
              'Newton\'s Second and Third Laws',
            ],
          },
        ],
      },
      {
        name: 'Work, Energy, and Simple Machines',
        code: 'SCI-9-7',
        topics: [
          {
            name: 'Work, Energy and Power',
            concepts: [
              'Work Done by a Constant Force',
              'Kinetic and Potential Energy',
            ],
          },
          {
            name: 'Simple Machines',
            concepts: [
              'Power',
              'Pulley, Inclined Plane and Lever',
            ],
          },
        ],
      },
      {
        name: 'Journey Inside the Atom',
        code: 'SCI-9-8',
        topics: [
          {
            name: 'Atomic Models',
            concepts: [
              'Thomson\'s Model and the Gold Foil Experiment',
              'Bohr\'s Model and Energy Levels',
            ],
          },
          {
            name: 'Atomic Number, Mass Number and Isotopes',
            concepts: [
              'Atomic Number and Mass Number',
              'Isotopes and Isobars',
            ],
          },
        ],
      },
      {
        name: 'Atomic Foundations of Matter',
        code: 'SCI-9-9',
        topics: [
          {
            name: 'Laws of Chemistry and Atomic Theory',
            concepts: [
              'Law of Conservation of Mass',
              'Law of Constant Proportions',
            ],
          },
          {
            name: 'Chemical Bonding and Formulae',
            concepts: [
              'Covalent and Ionic Bonds',
              'Molecular Mass and Formula Unit Mass',
            ],
          },
        ],
      },
      {
        name: 'Sound Waves: Characteristics and Applications',
        code: 'SCI-9-10',
        topics: [
          {
            name: 'Production and Propagation of Sound',
            concepts: [
              'Production of Sound and Tuning Fork',
              'Sound Needs a Medium to Propagate',
            ],
          },
          {
            name: 'Characteristics, Reflection and Applications',
            concepts: [
              'Wavelength, Frequency and Amplitude',
              'Echo, Reverberation and Ultrasonic Waves',
            ],
          },
        ],
      },
      {
        name: 'Reproduction: How Life Continues',
        code: 'SCI-9-11',
        topics: [
          {
            name: 'Asexual Reproduction',
            concepts: [
              'Asexual Reproduction',
              'Vegetative Propagation',
            ],
          },
          {
            name: 'Sexual Reproduction',
            concepts: [
              'Meiosis, Pollination and Fertilisation',
              'Gametogenesis and Human Reproduction',
            ],
          },
        ],
      },
      {
        name: 'Patterns in Life: Diversity and Classification',
        code: 'SCI-9-12',
        topics: [
          {
            name: 'Biodiversity and the Need for Classification',
            concepts: [
              'India as a Biodiversity Hotspot',
              'Need for Classification',
            ],
          },
          {
            name: 'Kingdoms and Scientific Naming',
            concepts: [
              'Five Kingdom Classification',
              'Binomial Nomenclature and Biodiversity Under Threat',
            ],
          },
        ],
      },
      {
        name: 'Earth as a System: Energy, Matter, and Life',
        code: 'SCI-9-13',
        topics: [
          {
            name: 'Uneven Heating, Winds and Ocean Currents',
            concepts: [
              'Uneven Heating of the Earth',
              'Winds and Ocean Currents',
            ],
          },
          {
            name: 'Biogeochemical Cycles and Human Impact',
            concepts: [
              'Water, Carbon, Nitrogen and Oxygen Cycles',
              'Human Impact on Earth\'s Processes',
            ],
          },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Orienting Yourself: The Use of Coordinates',
        code: 'MAT-9-1',
        topics: [
          {
            name: 'The Cartesian Coordinate System',
            concepts: [
              'Axes, Origin and Coordinates',
              'Quadrants and the Signs of Coordinates',
            ],
          },
          {
            name: 'Distance Between Two Points',
            concepts: [
              'The Distance Formula',
              'Coordinate Geometry in History and Navigation',
            ],
          },
        ],
      },
      {
        name: 'Introduction to Linear Polynomials',
        code: 'MAT-9-2',
        topics: [
          {
            name: 'Linear Polynomials and Their Degree',
            concepts: [
              'Algebraic Expressions, Variables and Coefficients',
              'Linear Polynomials and the Degree of a Polynomial',
            ],
          },
          {
            name: 'Linear Patterns, Relationships and Graphs',
            concepts: [
              'Linear Growth, Decay and Linear Relationships',
              'Visualising Linear Relationships with Graphs',
            ],
          },
        ],
      },
      {
        name: 'The World of Numbers',
        code: 'MAT-9-3',
        topics: [
          {
            name: 'From Counting to Zero: A History of Numbers',
            concepts: [
              'Early Counting Systems and One-to-One Correspondence',
              'Zero, the Bakhshali Manuscript and Brahmagupta’s Rules',
            ],
          },
          {
            name: 'Integers, Rational and Irrational Numbers',
            concepts: [
              'Integers, Fractions and the Density of Rational Numbers',
              'Irrational Numbers, Decimals and Cyclic Numbers',
            ],
          },
        ],
      },
      {
        name: 'Exploring Algebraic Identities',
        code: 'MAT-9-4',
        topics: [
          {
            name: 'Visualising Algebraic Identities',
            concepts: [
              'Standard Algebraic Identities',
              'Squares and Rectangles as Visual Proofs',
            ],
          },
          {
            name: 'Factorisation and Rational Expressions',
            concepts: [
              'Factorisation Using Identities and Algebra Tiles',
              'Simplifying Rational Expressions',
            ],
          },
        ],
      },
      {
        name: 'I\'m Up and Down, and Round and Round',
        code: 'MAT-9-5',
        topics: [
          {
            name: 'The Circle and Its Symmetry',
            concepts: [
              'Circle, Centre, Radius and Chord',
              'Symmetries of a Circle',
            ],
          },
          {
            name: 'Chords, Arcs and Theorems',
            concepts: [
              'Perpendicular Bisector of a Chord',
              'Angles Subtended by an Arc and Concyclicity',
            ],
          },
        ],
      },
      {
        name: 'Measuring Space: Perimeter and Area',
        code: 'MAT-9-6',
        topics: [
          {
            name: 'Perimeter and Circumference',
            concepts: [
              'Perimeter of a Shape',
              'The C/D Ratio and Circumference of a Circle',
            ],
          },
          {
            name: 'Area of Plane Figures',
            concepts: [
              'Area of a Triangle and Heron’s Formula',
              'Area of a Circle and Its Sector',
            ],
          },
        ],
      },
      {
        name: 'The Mathematics of Maybe: Introduction to Probability',
        code: 'MAT-9-7',
        topics: [
          {
            name: 'Measuring Probability',
            concepts: [
              'What is Probability?',
              'Experimental and Theoretical Probability',
            ],
          },
          {
            name: 'Sample Space, Events and Tree Diagrams',
            concepts: [
              'Sample Space and Events',
              'Tree Diagrams',
            ],
          },
        ],
      },
      {
        name: 'Predicting What Comes Next: Exploring Sequences and Progressions',
        code: 'MAT-9-8',
        topics: [
          {
            name: 'Sequences and Their Rules',
            concepts: [
              'Introduction to Sequences',
              'Explicit and Recursive Rules',
            ],
          },
          {
            name: 'Progressions',
            concepts: [
              'Arithmetic Progressions',
              'Geometric Progressions',
            ],
          },
        ],
      },
    ],
  },
  '10': {
    [SCIENCE]: [
      {
        name: 'Chemical Reactions and Equations',
        code: 'SCI-10-1',
        topics: [
          { name: 'Types of Reactions', concepts: ['Combination and Decomposition', 'Displacement Reactions'] },
          { name: 'Balancing Equations', concepts: ['Law of Conservation of Mass', 'Redox Reactions'] },
        ],
      },
      {
        name: 'Acids, Bases and Salts',
        code: 'SCI-10-2',
        topics: [
          { name: 'Properties of Acids and Bases', concepts: ['Litmus Test', 'Neutralisation'] },
          { name: 'pH Scale', concepts: ['Measuring pH', 'Strong and Weak Acids'] },
        ],
      },
      {
        name: 'Metals and Non-metals',
        code: 'SCI-10-3',
        topics: [
          { name: 'Physical Properties', concepts: ['Lustre, Conductivity', 'Hardness'] },
          { name: 'Chemical Properties', concepts: ['Reactivity Series', 'Displacement'] },
        ],
      },
      {
        name: 'Carbon and its Compounds',
        code: 'SCI-10-4',
        topics: [
          { name: 'Covalent Bonding', concepts: ['Electron Sharing', 'Structures'] },
          { name: 'Functional Groups', concepts: ['Alcohols, Aldehydes', 'Hydrocarbons'] },
        ],
      },
      {
        name: 'Life Processes',
        code: 'SCI-10-5',
        topics: [
          { name: 'Nutrition', concepts: ['Autotrophic and Heterotrophic', 'Digestion'] },
          { name: 'Transport in Humans', concepts: ['Circulatory System', 'Blood Vessels'] },
        ],
      },
      {
        name: 'Control and Coordination',
        code: 'SCI-10-6',
        topics: [
          { name: 'Nervous System', concepts: ['Neurons', 'Reflex Arc'] },
          { name: 'Hormones', concepts: ['Endocrine Glands', 'Feedback Mechanism'] },
        ],
      },
      {
        name: 'How do Organisms Reproduce?',
        code: 'SCI-10-7',
        topics: [
          { name: 'Asexual Reproduction', concepts: ['Binary Fission', 'Budding'] },
          { name: 'Sexual Reproduction', concepts: ['Flower Parts', 'Pollination'] },
        ],
      },
      {
        name: 'Heredity and Evolution',
        code: 'SCI-10-8',
        topics: [
          { name: 'Mendel\'s Laws', concepts: ['Dominant and Recessive', 'Punnett Square'] },
          { name: 'Evolution', concepts: ['Natural Selection', 'Speciation'] },
        ],
      },
      {
        name: 'Light - Reflection and Refraction',
        code: 'SCI-10-9',
        topics: [
          { name: 'Reflection', concepts: ['Laws of Reflection', 'Image Formation'] },
          { name: 'Refraction', concepts: ['Snell\'s Law', 'Lenses and Mirrors'] },
        ],
      },
      {
        name: 'Human Eye and Colourful World',
        code: 'SCI-10-10',
        topics: [
          { name: 'Structure of Eye', concepts: ['Retina, Lens', 'Defects of Vision'] },
          { name: 'Dispersion', concepts: ['Prism and Spectrum', 'Rainbow'] },
        ],
      },
      {
        name: 'Electricity',
        code: 'SCI-10-11',
        topics: [
          { name: 'Current and Resistance', concepts: ['Ohm\'s Law', 'Resistivity'] },
          { name: 'Electric Power', concepts: ['Heating Effect', 'Energy Consumption'] },
        ],
      },
      {
        name: 'Magnetic Effects of Electric Current',
        code: 'SCI-10-12',
        topics: [
          { name: 'Magnetic Field', concepts: ['Field Lines', 'Right-Hand Thumb Rule'] },
          { name: 'Electromagnetic Induction', concepts: ['Faraday\'s Law', 'Generators'] },
        ],
      },
      {
        name: 'Our Environment',
        code: 'SCI-10-13',
        topics: [
          { name: 'Ecosystems', concepts: ['Food Chains', 'Biogeochemical Cycles'] },
          { name: 'Environmental Issues', concepts: ['Ozone Depletion', 'Global Warming'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Real Numbers',
        code: 'MAT-10-1',
        topics: [
          { name: 'Euclid\'s Division', concepts: ['HCF', 'LCM'] },
          { name: 'Irrational Numbers', concepts: ['Decimal Expansion', 'Proving Irrationality'] },
        ],
      },
      {
        name: 'Polynomials',
        code: 'MAT-10-2',
        topics: [
          { name: 'Zeroes of Polynomials', concepts: ['Degree', 'Graph'] },
          { name: 'Factor Theorem', concepts: ['Division Algorithm', 'Remainder Theorem'] },
        ],
      },
      {
        name: 'Pair of Linear Equations in Two Variables',
        code: 'MAT-10-3',
        topics: [
          { name: 'Graphical Method', concepts: ['Consistent and Inconsistent', 'Coincident Lines'] },
          { name: 'Algebraic Methods', concepts: ['Substitution and Elimination', 'Cross Multiplication'] },
        ],
      },
      {
        name: 'Quadratic Equations',
        code: 'MAT-10-4',
        topics: [
          { name: 'Solving Quadratics', concepts: ['Factoring', 'Quadratic Formula'] },
          { name: 'Nature of Roots', concepts: ['Discriminant', 'Real and Complex Roots'] },
        ],
      },
      {
        name: 'Arithmetic Progressions',
        code: 'MAT-10-5',
        topics: [
          { name: 'AP Basics', concepts: ['nth Term of an AP', 'Common Difference'] },
          { name: 'Sum of n Terms', concepts: ['Formula', 'Applications'] },
        ],
      },
      {
        name: 'Triangles',
        code: 'MAT-10-6',
        topics: [
          { name: 'Similarity', concepts: ['AA, SAS, SSS Criteria', 'Thales Theorem'] },
          { name: 'Area of Similar Triangles', concepts: ['Ratio of Areas', 'Applications'] },
        ],
      },
      {
        name: 'Coordinate Geometry',
        code: 'MAT-10-7',
        topics: [
          { name: 'Distance Formula', concepts: ['Distance Between Points', 'Section Formula'] },
          { name: 'Area of Triangle', concepts: ['Using Coordinates', 'Collinearity'] },
        ],
      },
      {
        name: 'Introduction to Trigonometry',
        code: 'MAT-10-8',
        topics: [
          { name: 'Trigonometric Ratios', concepts: ['Sine, Cosine, Tangent', 'Right Triangle'] },
          { name: 'Trigonometric Identities', concepts: ['Pythagorean Identity', 'Values of Standard Angles'] },
        ],
      },
      {
        name: 'Applications of Trigonometry',
        code: 'MAT-10-9',
        topics: [
          { name: 'Heights and Distances', concepts: ['Angle of Elevation', 'Angle of Depression'] },
          { name: 'Practical Problems', concepts: ['Word Problems', 'Surveying'] },
        ],
      },
      {
        name: 'Circles',
        code: 'MAT-10-10',
        topics: [
          { name: 'Tangents', concepts: ['Tangent to a Circle', 'Length of Tangent'] },
          { name: 'Chords and Arcs', concepts: ['Perpendicular from Centre', 'Cyclic Quadrilateral'] },
        ],
      },
      {
        name: 'Constructions',
        code: 'MAT-10-15',
        topics: [
          { name: 'Division of Line Segment', concepts: ['Internal Division', 'Golden Ratio'] },
          { name: 'Tangents', concepts: ['Tangent from External Point', 'Construction'] },
        ],
      },
      {
        name: 'Areas Related to Circles',
        code: 'MAT-10-11',
        topics: [
          { name: 'Area of Sector', concepts: ['Arc Length', 'Sector Area'] },
          { name: 'Segment Area', concepts: ['Minor and Major Segment', 'Composite Figures'] },
        ],
      },
      {
        name: 'Surface Areas and Volumes',
        code: 'MAT-10-12',
        topics: [
          { name: 'Solids', concepts: ['Cylinder, Cone, Sphere', 'Combination of Solids'] },
          { name: 'Conversion of Solids', concepts: ['Frustum', 'Surface Area Change'] },
        ],
      },
      {
        name: 'Statistics',
        code: 'MAT-10-13',
        topics: [
          { name: 'Measures of Central Tendency', concepts: ['Mean, Median, Mode', 'Grouped Data'] },
          { name: 'Ogive', concepts: ['Less Than and More Than', 'Median from Ogive'] },
        ],
      },
      {
        name: 'Probability',
        code: 'MAT-10-14',
        topics: [
          { name: 'Classical Probability', concepts: ['Favourable Outcomes', 'Sample Space'] },
          { name: 'Theoretical Probability', concepts: ['Events', 'Compound Events'] },
        ],
      },
    ],
    [ENGLISH]: [
      {
        name: 'A Letter to God',
        code: 'ENG-10-1',
        topics: [
          { name: 'Story', concepts: ['Lencho and the Ruined Harvest', 'The Letter to God'] },
          { name: 'Language', concepts: ['Humble Faith and Hope', 'Irony in the Story'] },
        ],
      },
      {
        name: 'Nelson Mandela: Long Walk to Freedom',
        code: 'ENG-10-2',
        topics: [
          { name: 'Story', concepts: ['Apartheid and the Struggle', 'The Inauguration of Freedom'] },
          { name: 'Language', concepts: ['Rhetoric of Freedom and Equality', 'Values of Sacrifice and Leadership'] },
        ],
      },
      {
        name: 'Two Stories about Flying',
        code: 'ENG-10-3',
        topics: [
          { name: 'Story', concepts: ['His First Flight', 'The Flying Machine'] },
          { name: 'Language', concepts: ['Courage and Overcoming Fear', 'Descriptive Writing and Imagery'] },
        ],
      },
      {
        name: 'From the Diary of Anne Frank',
        code: 'ENG-10-4',
        topics: [
          { name: 'Story', concepts: ['Anne Frank and the War', 'Life in Hiding'] },
          { name: 'Language', concepts: ['Diary Entry Style', 'Hope and Humanity in Adversity'] },
        ],
      },
      {
        name: 'Glimpses of India',
        code: 'ENG-10-5',
        topics: [
          { name: 'Story', concepts: ['A Baker from Goa', 'The Bangle Sellers'] },
          { name: 'Language', concepts: ['Portuguese Heritage in Goa', 'Words of Trade and Daily Life'] },
        ],
      },
      {
        name: 'Mijbil the Otter',
        code: 'ENG-10-6',
        topics: [
          { name: 'Story', concepts: ['Gavin Maxwell and Mijbil', 'The Return of the Otter'] },
          { name: 'Language', concepts: ['First Person Narrative', 'Vocabulary of Animals and Nature'] },
        ],
      },
      {
        name: 'Madam Rides the Bus',
        code: 'ENG-10-7',
        topics: [
          { name: 'Story', concepts: ['Valli and Her First Bus Ride', 'A Moment of Life and Death'] },
          { name: 'Language', concepts: ['Descriptive Language', 'Words of Travel and Places'] },
        ],
      },
      {
        name: 'The Sermon at Benares',
        code: 'ENG-10-8',
        topics: [
          { name: 'Story', concepts: ['Gautama Buddha and Human Sorrows', 'The Sermon at Benares'] },
          { name: 'Language', concepts: ['Sermon as a Form of Speech', 'Vocabulary from the Text'] },
        ],
      },
      {
        name: 'The Proposal',
        code: 'ENG-10-9',
        topics: [
          { name: 'Story', concepts: ['R, G and the Proposal', 'A Russian Wedding'] },
          { name: 'Language', concepts: ['Humour and Verbal Comedy', 'Formal Letter Writing'] },
        ],
      },
    ],
  },
};

function question(
  grade: string,
  subject: string,
  chapterName: string,
  spec: {
    type: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
    text: string;
    answer: string;
    marks: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    options?: { text: string; isCorrect: boolean }[];
  },
) {
  const chapter = CHAPTERS[`${grade}|${subject}|${chapterName}`];
  if (!chapter) throw new Error(`Missing chapter ${grade} ${subject} ${chapterName}`);
  return {
    boardId: BOARD.id,
    grade,
    subjectId: CHAPTERS[`${grade}|${subject}|${chapterName}`].subjectId,
    chapterId: chapter.id,
    type: spec.type,
    text: spec.text,
    answer: spec.answer,
    marks: spec.marks,
    difficulty: spec.difficulty ?? 'MEDIUM',
    status: 'APPROVED',
    source: 'SEED',
    explanation: 'Refer to the chapter notes for the detailed solution.',
    options: spec.options ? { create: spec.options } : undefined,
  };
}

let BOARD: { id: string };
const CHAPTERS: Record<string, { id: string; subjectId: string }> = {};
const CHAPTER_KEY_BY_ID: Record<string, string> = {};
const CONCEPT_IDS: Record<string, Record<string, string>> = {};

const SUBJECT_META: Record<string, { code: string; color: string }> = {
  [SCIENCE]: { code: 'SCI', color: '#0ea5e9' },
  [MATHS]: { code: 'MAT', color: '#f97316' },
  [ENGLISH]: { code: 'ENG', color: '#7c3aed' },
};

async function seedCurriculum() {
  BOARD = await prisma.board.upsert({
    where: { code: 'CBSE' },
    update: {},
    create: { name: 'CBSE', code: 'CBSE', active: true },
  });

  const grades = await Promise.all(
    Object.keys(CURRICULUM).map((gradeName, i) =>
      prisma.grade.upsert({
        where: { boardId_name: { boardId: BOARD.id, name: gradeName } },
        update: {},
        create: { boardId: BOARD.id, name: gradeName, order: i },
      }),
    ),
  );
  const gradeNames = grades.map((g) => g.name);

  const subjects = await Promise.all(
    [SCIENCE, MATHS, ENGLISH].map((name, i) => {
      const meta = SUBJECT_META[name];
      return prisma.subject.upsert({
        where: { boardId_code: { boardId: BOARD.id, code: meta.code } },
        update: {},
        create: { boardId: BOARD.id, code: meta.code, name, order: i, color: meta.color },
      });
    }),
  );
  const subjectByName = (name: string) => subjects.find((s) => s.name === name)!;

  for (const gradeName of gradeNames) {
    for (const [subjectName, chapters] of Object.entries(CURRICULUM[gradeName])) {
      for (const ch of chapters) {
        const subj = subjectByName(subjectName);
        const chapter = await prisma.chapter.upsert({
          where: { subjectId_code: { subjectId: subj.id, code: ch.code } },
          update: { name: ch.name },
          create: { subjectId: subj.id, name: ch.name, code: ch.code, grade: gradeName },
        });
        CHAPTERS[`${gradeName}|${subjectName}|${ch.name}`] = { id: chapter.id, subjectId: subj.id };
        CHAPTER_KEY_BY_ID[chapter.id] = `${gradeName}|${subjectName}|${ch.name}`;

        for (const [ti, topic] of ch.topics.entries()) {
          const dbTopic = await prisma.topic.upsert({
            where: { chapterId_name: { chapterId: chapter.id, name: topic.name } },
            update: { order: ti },
            create: { chapterId: chapter.id, name: topic.name, order: ti },
          });
          for (const [ci, conceptName] of topic.concepts.entries()) {
            const dbConcept = await prisma.concept.upsert({
              where: { topicId_name: { topicId: dbTopic.id, name: conceptName } },
              update: { order: ci },
              create: { topicId: dbTopic.id, name: conceptName, order: ci },
            });
            if (!CONCEPT_IDS[`${gradeName}|${subjectName}|${ch.name}`]) {
              CONCEPT_IDS[`${gradeName}|${subjectName}|${ch.name}`] = {};
            }
            CONCEPT_IDS[`${gradeName}|${subjectName}|${ch.name}`][conceptName] = dbConcept.id;
          }
        }
      }
    }
  }
}

async function ensureSystemInstitution() {
  const existing = await prisma.institution.findFirst({
    where: { isSystemInstitution: true },
  });
  if (existing) return existing;
  return prisma.institution.create({
    data: {
      id: '00000000-0000-0000-0000-00000000a5a1',
      name: 'Sanro AI',
      type: 'SANRO_PLATFORM',
      isSystemInstitution: true,
      status: 'ACTIVE',
      code: 'SANRO-AI',
    },
  });
}

async function seedPlansAndInstitution() {
  const institutionPlan = await prisma.plan.findUnique({ where: { key: 'INSTITUTION' } });
  if (!institutionPlan) throw new Error('INSTITUTION plan missing ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â run the system seed first.');

  const institution = await prisma.institution.upsert({
    where: { code: 'DEMO01' },
    update: {},
    create: {
      name: 'Sanro AI',
      type: 'SCHOOL',
      status: 'ACTIVE',
      code: 'DEMO01',
      city: 'Pune',
      state: 'Maharashtra',
      seatLimit: 200,
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { institutionId_name: { institutionId: institution.id, name: '2026-2027' } },
    update: {},
    create: {
      institutionId: institution.id,
      name: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  const demoSchool = new Date('2026-09-01');
  const later = new Date('2027-03-31');
  const existingSub = await prisma.subscription.findFirst({
    where: { institutionId: institution.id, planId: institutionPlan.id },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        institutionId: institution.id,
        planId: institutionPlan.id,
        status: 'ACTIVE',
        seatLimit: 200,
        startedAt: demoSchool,
        endsAt: later,
      },
    });
  }

  return { institution, academicYear };
}

async function seedUsers(institutionId: string, academicYearId: string) {
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sanroai.com' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@sanroai.com', passwordHash: HASH, isSuperAdmin: true },
  });

  const principal = await prisma.user.upsert({
    where: { email: 'principal@sanroai.com' },
    update: {},
    create: { name: 'Principal Sharma', email: 'principal@sanroai.com', phone: '9822000001', passwordHash: HASH },
  });
  await prisma.institutionMember.upsert({
    where: { institutionId_userId: { institutionId, userId: principal.id } },
    update: {},
    create: { institutionId, userId: principal.id, role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@sanroai.com' },
    update: {},
    create: { name: 'Teacher Patil', email: 'teacher@sanroai.com', phone: '9822000002', passwordHash: HASH },
  });
  await prisma.institutionMember.upsert({
    where: { institutionId_userId: { institutionId, userId: teacherUser.id } },
    update: {},
    create: { institutionId, userId: teacherUser.id, role: 'TEACHER', status: 'ACTIVE' },
  });
  const scienceSubject = await prisma.subject.findFirst({ where: { boardId: BOARD.id, name: SCIENCE } });
  const mathsSubject = await prisma.subject.findFirst({ where: { boardId: BOARD.id, name: MATHS } });
  const englishSubject = await prisma.subject.findFirst({ where: { boardId: BOARD.id, name: ENGLISH } });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      institutionId,
      userId: teacherUser.id,
      employeeId: 'T-1001',
      status: 'ACTIVE',
      subjects: {
        create: [
          ...(scienceSubject ? [{ subjectId: scienceSubject.id }] : []),
          ...(mathsSubject ? [{ subjectId: mathsSubject.id }] : []),
          ...(englishSubject ? [{ subjectId: englishSubject.id }] : []),
        ],
      },
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@sanroai.com' },
    update: {},
    create: { name: 'Aarav Sharma', email: 'student@sanroai.com', phone: '9822000003', passwordHash: HASH },
  });
  await prisma.institutionMember.upsert({
    where: { institutionId_userId: { institutionId, userId: studentUser.id } },
    update: {},
    create: { institutionId, userId: studentUser.id, role: 'STUDENT', status: 'ACTIVE' },
  });
  const student = await prisma.student.upsert({
    where: { institutionId_email: { institutionId, email: 'student@sanroai.com' } },
    update: {},
    create: {
      institutionId,
      academicYearId,
      userId: studentUser.id,
      name: 'Aarav Sharma',
      email: 'student@sanroai.com',
      phone: '9822000003',
      rollNumber: 'R1001',
      grade: '10',
      status: 'ACTIVE',
    },
  });
  await prisma.gamificationProfile.upsert({
    where: { studentId: student.id },
    update: {},
    create: { studentId: student.id, xp: 420, streakDays: 7 },
  });
  // a re-seed starts the demo history from scratch: the counter and the ledger
  // must always agree
  await prisma.xpEvent.deleteMany({ where: { studentId: student.id } });
  await prisma.xpEvent.create({ data: { studentId: student.id, xp: 420, reason: 'SEED' } });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@sanroai.com' },
    update: {},
    create: { name: 'Mrs Sharma', email: 'parent@sanroai.com', phone: '9822000004', passwordHash: HASH, isSuperAdmin: false },
  });
  await prisma.institutionMember.upsert({
    where: { institutionId_userId: { institutionId, userId: parentUser.id } },
    update: {},
    create: { institutionId, userId: parentUser.id, role: 'PARENT', status: 'ACTIVE' },
  });
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { institutionId, userId: parentUser.id, name: parentUser.name, email: parentUser.email, phone: parentUser.phone },
  });
  await prisma.parentStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: {},
    create: { parentId: parent.id, studentId: student.id },
  });

  const group = await prisma.group.upsert({
    where: { academicYearId_name: { academicYearId, name: 'Class 10 - A' } },
    update: {},
    create: { institutionId, academicYearId, name: 'Class 10 - A', type: 'CLASS', grade: '10', status: 'ACTIVE' },
  });
  await prisma.groupMembership.upsert({
    where: { groupId_studentId_academicYearId: { groupId: group.id, studentId: student.id, academicYearId } },
    update: {},
    create: { groupId: group.id, studentId: student.id, academicYearId },
  });

  return { superAdmin, principal, teacherUser, teacher, studentUser, student, parent, group };
}

async function seedDemoAcademics(args: {
  institutionId: string;
  academicYearId: string;
  teacherId: string;
  studentId: string;
  groupId: string;
}) {
  const { institutionId, academicYearId, teacherId, studentId, groupId } = args;

  await prisma.teacherGroup.upsert({
    where: { teacherId_groupId_academicYearId: { teacherId, groupId, academicYearId } },
    update: {},
    create: { teacherId, groupId, academicYearId },
  });

  const weakMastery = await prisma.conceptMastery.findMany({
    where: { studentId, score: { lt: 50 } },
    include: { concept: { select: { id: true, name: true } } },
    orderBy: { score: 'asc' },
    take: 2,
  });

  if (weakMastery.length > 0) {
    const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@sanroai.com' } });

    async function seedPlan(conceptId: string, conceptName: string, status: 'ACTIVE' | 'COMPLETED', completedAt?: Date) {
      const existing = await prisma.remediationPlan.findFirst({ where: { studentId, conceptId } });
      if (existing) return;
      await prisma.remediationPlan.create({
        data: {
          studentId,
          conceptId,
          status,
          completedAt,
          createdById: teacherUser?.id ?? undefined,
          items: {
            create: [
              { order: 1, contentType: 'VIDEO', title: `Watch video: ${conceptName}`, status: 'COMPLETED', completedAt },
              status === 'COMPLETED'
                ? { order: 2, contentType: 'QUIZ', title: `Practice quiz: ${conceptName}`, status: 'COMPLETED' as const, completedAt }
                : { order: 2, contentType: 'QUIZ', title: `Practice quiz: ${conceptName}`, status: 'PENDING' as const },
            ],
          },
        },
      });
    }

    const [interventionConcept, weakConcept] = weakMastery;
    await seedPlan(
      interventionConcept.concept.id,
      interventionConcept.concept.name,
      'ACTIVE',
      new Date(Date.now() - 86400000),
    );
    if (weakConcept) {
      await seedPlan(
        weakConcept.concept.id,
        weakConcept.concept.name,
        'COMPLETED',
        new Date(Date.now() - 172800000),
      );
    }
  }

  const scienceSubject = await prisma.subject.findFirst({ where: { boardId: BOARD.id, name: SCIENCE } });
  const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@sanroai.com' } });
  if (scienceSubject && teacherUser) {
    const ASSESSMENT_TITLE = 'Exploration: Entering the World of Secondary Science - Class Test';
    // the assessment was renamed with its chapter and its old title was
    // double-encoded, so the existing row is renamed instead of duplicated
    const existing = await prisma.assessment.findFirst({
      where: { institutionId, title: { in: [ASSESSMENT_TITLE, 'Matter in Our Surroundings ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Class Test'] } },
    });
    const assessment = existing
      ? existing.title === ASSESSMENT_TITLE
        ? existing
        : await prisma.assessment.update({
            where: { id: existing.id },
            data: { title: ASSESSMENT_TITLE },
          })
      : await prisma.assessment.create({
          data: {
            institutionId,
            title: ASSESSMENT_TITLE,
            subjectId: scienceSubject.id,
            totalMarks: 20,
            durationMinutes: 30,
            status: 'PUBLISHED',
            mode: 'DIGITAL',
            attemptsAllowed: 1,
            createdById: teacherUser.id,
        dueAt: new Date(Date.now() + 3 * 86400000),
        assignments: { create: [{ groupId, studentId }] },
        },
      });

    await prisma.assessmentAttempt.upsert({
      where: { assessmentId_studentId_attemptIndex: { assessmentId: assessment.id, studentId, attemptIndex: 1 } },
      update: {},
      create: {
        assessmentId: assessment.id,
        studentId,
        attemptIndex: 1,
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 2 * 86400000),
        score: 14,
        maxScore: 20,
        correctCount: 7,
        wrongCount: 3,
        accuracy: 70.0,
        timeSpentSeconds: 900,
      },
    });
  }
}

async function seedQuestions() {

  const scienceQuestions = [
    question('8', SCIENCE, 'Exploring the Investigative World of Science', {
      type: 'MCQ',
      text: 'In the puri investigation, which of these is something you can measure?',
      answer: 'The time taken by the puri to puff up',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'The brand of the oil used', isCorrect: false },
        { text: 'The time taken by the puri to puff up', isCorrect: true },
        { text: 'The colour of the wheat flour', isCorrect: false },
        { text: 'The size of the kitchen', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Exploring the Investigative World of Science', {
      type: 'SHORT_ANSWER',
      text: 'Why should you change only one thing at a time while doing an experiment?',
      answer: 'If more than one thing is changed at a time, you cannot tell which change produced the difference you saw. Changing one variable and keeping everything else the same makes the test a fair one.',
      marks: 2,
    }),
    question('8', SCIENCE, 'Exploring the Investigative World of Science', {
      type: 'MCQ',
      text: 'Which is the best record to keep while investigating?',
      answer: 'A written note of what you changed, what you observed and what you measured',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'A written note of what you changed, what you observed and what you measured', isCorrect: true },
        { text: 'Only the final result', isCorrect: false },
        { text: 'A guess about the answer', isCorrect: false },
        { text: 'The names of the people who helped', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'The Invisible Living World: Beyond Our Naked Eye', {
      type: 'MCQ',
      text: 'Which part of the cell controls all its activities?',
      answer: 'The nucleus',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'The cell wall', isCorrect: false },
        { text: 'The cytoplasm', isCorrect: false },
        { text: 'The nucleus', isCorrect: true },
        { text: 'The vacuole', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'The Invisible Living World: Beyond Our Naked Eye', {
      type: 'MCQ',
      text: 'Which scientist first observed cells in thin slices of cork in 1665?',
      answer: 'Robert Hooke',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Antonie van Leeuwenhoek', isCorrect: false },
        { text: 'Robert Hooke', isCorrect: true },
        { text: 'Gregor Mendel', isCorrect: false },
        { text: 'Louis Pasteur', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'The Invisible Living World: Beyond Our Naked Eye', {
      type: 'MCQ',
      text: 'Which is the correct order of levels of organisation?',
      answer: 'Cell, tissue, organ, organ system, organism',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Organism, organ system, organ, tissue, cell', isCorrect: false },
        { text: 'Cell, tissue, organ, organ system, organism', isCorrect: true },
        { text: 'Tissue, cell, organ, organism, organ system', isCorrect: false },
        { text: 'Cell, organ, tissue, organ system, organism', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Health: The Ultimate Treasure', {
      type: 'MCQ',
      text: 'According to the WHO, health is a state of complete __.',
      answer: 'Physical, mental and social well-being',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Physical, mental and social well-being', isCorrect: true },
        { text: 'Physical fitness alone', isCorrect: false },
        { text: 'Absence of disease alone', isCorrect: false },
        { text: 'Good marks in school', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Health: The Ultimate Treasure', {
      type: 'MCQ',
      text: 'Diabetes is an example of a __ disease.',
      answer: 'Non-communicable',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Communicable', isCorrect: false },
        { text: 'Non-communicable', isCorrect: true },
        { text: 'Deficiency', isCorrect: false },
        { text: 'Water-borne', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Health: The Ultimate Treasure', {
      type: 'SHORT_ANSWER',
      text: 'Why must an antibiotic course be completed fully instead of being stopped as soon as you feel better?',
      answer: 'Antibiotics kill bacteria only. Stopping early leaves the surviving bacteria to multiply again, so the infection returns stronger and the bacteria become resistant to the antibiotic.',
      marks: 2,
    }),
    question('8', MATHS, 'A Square and A Cube', {
      type: 'MCQ',
      text: 'Which of the following is a perfect square?',
      answer: '144',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '108', isCorrect: false },
        { text: '144', isCorrect: true },
        { text: '150', isCorrect: false },
        { text: '170', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'A Square and A Cube', {
      type: 'MCQ',
      text: 'The sum of the first n odd numbers is equal to __.',
      answer: 'n squared',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'n squared', isCorrect: true },
        { text: '2n', isCorrect: false },
        { text: 'n cubed', isCorrect: false },
        { text: 'n + 1', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'A Square and A Cube', {
      type: 'SHORT_ANSWER',
      text: 'The cube root of 125 is 5. Explain how you can check that this is correct.',
      answer: '5 cubed is 5 x 5 x 5 = 125, so the number whose cube is 125 is 5. A perfect cube is a number obtained by multiplying a number by itself three times.',
      marks: 2,
    }),
    question('8', MATHS, 'Power Play', {
      type: 'MCQ',
      text: 'In the expression 5 to the power 4 = 625, the number 4 is called the __.',
      answer: 'Exponent',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Base', isCorrect: false },
        { text: 'Exponent', isCorrect: true },
        { text: 'Power of ten', isCorrect: false },
        { text: 'Coefficient', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Power Play', {
      type: 'MCQ',
      text: 'Using the laws of exponents, 4 to the power 6 multiplied by 4 to the power 3 equals __.',
      answer: '4 to the power 9',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '4 to the power 24', isCorrect: false },
        { text: '4 to the power 18', isCorrect: false },
        { text: '4 to the power 9', isCorrect: true },
        { text: '8 to the power 9', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Power Play', {
      type: 'MCQ',
      text: 'The standard (scientific) form of 20800 is __.',
      answer: '2.08 x 10 to the power 4',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '2.08 x 10 to the power 4', isCorrect: true },
        { text: '20.8 x 10 to the power 3', isCorrect: false },
        { text: '0.208 x 10 to the power 5', isCorrect: false },
        { text: '208 x 10 to the power 2', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'A Story of Numbers', {
      type: 'MCQ',
      text: 'The earliest physical evidence of people recording numbers is a set of __ carved on bone.',
      answer: 'Tally marks',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Tally marks', isCorrect: true },
        { text: 'Hindu numerals', isCorrect: false },
        { text: 'Arabic numerals', isCorrect: false },
        { text: 'Binary digits', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'A Story of Numbers', {
      type: 'MCQ',
      text: 'The landmark numbers of the Roman numeral system are I, V, X, L, C, D and __.',
      answer: 'M',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'I', isCorrect: false },
        { text: 'V', isCorrect: false },
        { text: 'M', isCorrect: true },
        { text: 'Z', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'A Story of Numbers', {
      type: 'SHORT_ANSWER',
      text: 'What is the idea of a base in a number system, and why does it make multiplication easy?',
      answer: 'A base-(n) number system is one in which each landmark number is obtained by multiplying the previous one by the same number n, so the landmark numbers are the powers of n. Because the product of two landmark numbers is itself a landmark number, multiplication becomes easy.',
      marks: 2,
    }),

    question('10', SCIENCE, 'Chemical Reactions and Equations', {
      type: 'MCQ',
      text: 'Which of the following is an example of a combination reaction?',
      answer: 'CaO + CO2 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ CaCO3',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'CaCO3 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ CaO + CO2', isCorrect: false },
        { text: 'CaO + CO2 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ CaCO3', isCorrect: true },
        { text: 'Zn + H2SO4 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ ZnSO4 + H2', isCorrect: false },
        { text: 'NaOH + HCl ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ NaCl + H2O', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Chemical Reactions and Equations', {
      type: 'SHORT_ANSWER',
      text: 'Write the balanced chemical equation for the reaction of zinc with dilute sulphuric acid.',
      answer: 'Zn + H2SO4 -> ZnSO4 + H2 (Displacement reaction)',
      marks: 2,
    }),
    question('10', SCIENCE, 'Acids, Bases and Salts', {
      type: 'MCQ',
      text: 'Which indicator turns red in acidic solution?',
      answer: 'Methyl orange',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Phenolphthalein', isCorrect: false },
        { text: 'Methyl orange', isCorrect: true },
        { text: 'Litmus', isCorrect: false },
        { text: 'Universal indicator', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Acids, Bases and Salts', {
      type: 'SHORT_ANSWER',
      text: 'What happens when sodium hydroxide reacts with hydrochloric acid?',
      answer: 'NaOH + HCl -> NaCl + H2O (Neutralisation reaction forming salt and water)',
      marks: 2,
    }),
    question('10', SCIENCE, 'Light - Reflection and Refraction', {
      type: 'MCQ',
      text: 'The angle of incidence is equal to the angle of __.',
      answer: 'Reflection',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Refraction', isCorrect: false },
        { text: 'Reflection', isCorrect: true },
        { text: 'Incidence', isCorrect: false },
        { text: 'Deviation', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Electricity', {
      type: 'MCQ',
      text: 'The SI unit of electric current is __.',
      answer: 'Ampere',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Volt', isCorrect: false },
        { text: 'Watt', isCorrect: false },
        { text: 'Ampere', isCorrect: true },
        { text: 'Ohm', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Electricity', {
      type: 'SHORT_ANSWER',
      text: 'State Ohm\'s law and write its mathematical form.',
      answer: 'Ohm\'s law states that current through a conductor is directly proportional to the potential difference across it, provided physical conditions remain constant. V = IR.',
      marks: 2,
    }),
    question('10', MATHS, 'Real Numbers', {
      type: 'MCQ',
      text: 'HCF of 12 and 18 is __.',
      answer: '6',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '2', isCorrect: false },
        { text: '3', isCorrect: false },
        { text: '6', isCorrect: true },
        { text: '36', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Polynomials', {
      type: 'MCQ',
      text: 'A polynomial of degree 2 is called __.',
      answer: 'Quadratic polynomial',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Linear polynomial', isCorrect: false },
        { text: 'Quadratic polynomial', isCorrect: true },
        { text: 'Cubic polynomial', isCorrect: false },
        { text: 'Constant polynomial', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Quadratic Equations', {
      type: 'SHORT_ANSWER',
      text: 'Solve: x^2 - 5x + 6 = 0',
      answer: 'x = 2 or x = 3 (by factoring: (x-2)(x-3) = 0)',
      marks: 2,
    }),
    question('10', MATHS, 'Introduction to Trigonometry', {
      type: 'MCQ',
      text: 'sin 30 degrees = ?',
      answer: '1/2',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '1/2', isCorrect: true },
        { text: '1/sqrt(2)', isCorrect: false },
        { text: 'sqrt(3)/2', isCorrect: false },
        { text: '1', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Arithmetic Progressions', {
      type: 'SHORT_ANSWER',
      text: 'Find the 10th term of the AP: 2, 5, 8, 11, ...',
      answer: 'a = 2, d = 3, a10 = 2 + 9(3) = 29',
      marks: 2,
    }),
    question('10', MATHS, 'Statistics', {
      type: 'MCQ',
      text: 'The median of the data 3, 5, 7, 9, 11 is __.',
      answer: '7',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '5', isCorrect: false },
        { text: '7', isCorrect: true },
        { text: '9', isCorrect: false },
        { text: '6', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Probability', {
      type: 'SHORT_ANSWER',
      text: 'What is the probability of getting a head when tossing a coin?',
      answer: 'P(head) = 1/2',
      marks: 2,
    }),
    question('10', SCIENCE, 'Metals and Non-metals', {
      type: 'MCQ',
      text: 'Which of the following is a non-metal?',
      answer: 'Sulphur',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Iron', isCorrect: false },
        { text: 'Copper', isCorrect: false },
        { text: 'Sulphur', isCorrect: true },
        { text: 'Aluminium', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Carbon and its Compounds', {
      type: 'MCQ',
      text: 'The general formula of alkanes is __.',
      answer: 'CnH2n+2',
      marks: 1,
      difficulty: 'MEDIUM',
      options: [
        { text: 'CnH2n', isCorrect: false },
        { text: 'CnH2n+2', isCorrect: true },
        { text: 'CnH2n-2', isCorrect: false },
        { text: 'CnHn', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Life Processes', {
      type: 'SHORT_ANSWER',
      text: 'Name the organ where urea is formed in the human body.',
      answer: 'Liver (urea is formed during deamination of amino acids).',
      marks: 2,
    }),
    question('10', SCIENCE, 'Control and Coordination', {
      type: 'MCQ',
      text: 'Which part of the brain controls voluntary actions?',
      answer: 'Cerebrum',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Cerebellum', isCorrect: false },
        { text: 'Cerebrum', isCorrect: true },
        { text: 'Medulla', isCorrect: false },
        { text: 'Pons', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Heredity and Evolution', {
      type: 'SHORT_ANSWER',
      text: 'What is the genotype of a tall plant (T) if it is heterozygous?',
      answer: 'Tt',
      marks: 1,
    }),
    question('10', SCIENCE, 'Human Eye and Colourful World', {
      type: 'MCQ',
      text: 'The least distance of distinct vision for a normal eye is __.',
      answer: '25 cm',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '20 cm', isCorrect: false },
        { text: '25 cm', isCorrect: true },
        { text: '30 cm', isCorrect: false },
        { text: '50 cm', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Magnetic Effects of Electric Current', {
      type: 'MCQ',
      text: 'The magnetic field around a straight current-carrying conductor is __.',
      answer: 'Concentric circles',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Straight lines', isCorrect: false },
        { text: 'Concentric circles', isCorrect: true },
        { text: 'Ellipses', isCorrect: false },
        { text: 'Spirals', isCorrect: false },
      ],
    }),
    question('10', SCIENCE, 'Our Environment', {
      type: 'SHORT_ANSWER',
      text: 'What is the role of decomposers in an ecosystem?',
      answer: 'Decomposers break down dead organisms and waste materials, returning nutrients to the soil for reuse by producers.',
      marks: 2,
    }),
    question('10', MATHS, 'Pair of Linear Equations in Two Variables', {
      type: 'SHORT_ANSWER',
      text: 'Solve: x + y = 5 and x - y = 1',
      answer: 'x = 3, y = 2 (by adding: 2x = 6, x = 3)',
      marks: 2,
    }),
    question('10', MATHS, 'Triangles', {
      type: 'MCQ',
      text: 'In similar triangles, the ratio of corresponding sides is __.',
      answer: 'Equal',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Equal', isCorrect: true },
        { text: 'Proportional', isCorrect: false },
        { text: 'Inverse', isCorrect: false },
        { text: 'None', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Coordinate Geometry', {
      type: 'SHORT_ANSWER',
      text: 'Find the distance between points (1, 2) and (4, 6).',
      answer: 'd = sqrt((4-1)^2 + (6-2)^2) = sqrt(9+16) = sqrt(25) = 5 units',
      marks: 2,
    }),
    question('10', MATHS, 'Circles', {
      type: 'MCQ',
      text: 'The tangent at any point of a circle is perpendicular to the __.',
      answer: 'Radius through the point of contact',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Chord', isCorrect: false },
        { text: 'Radius through the point of contact', isCorrect: true },
        { text: 'Diameter', isCorrect: false },
        { text: 'Arc', isCorrect: false },
      ],
    }),
    question('10', MATHS, 'Surface Areas and Volumes', {
      type: 'SHORT_ANSWER',
      text: 'Find the curved surface area of a cylinder with radius 7 cm and height 10 cm.',
      answer: 'CSA = 2*pi*r*h = 2 * 22/7 * 7 * 10 = 440 cm^2',
      marks: 2,
    }),

    question('9', SCIENCE, 'Exploration: Entering the World of Secondary Science', {
      type: 'MCQ',
      text: 'A scientific model is a __ way of looking at a real system.',
      answer: 'Simplified',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Simplified', isCorrect: true },
        { text: 'Complete', isCorrect: false },
        { text: 'Imaginary', isCorrect: false },
        { text: 'Accidental', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Exploration: Entering the World of Secondary Science', {
      type: 'SHORT_ANSWER',
      text: 'In making a simple model of a cricket shot for a six, which details would you keep and which would you ignore?',
      answer: 'Keep the mass of the ball and the speed and direction of the hit, because they decide whether the ball crosses the boundary. Ignore the brand of the bat, the colour of the ball, the grass on the field, the spin and the stitching of the seam, because they make no difference to that question.',
      marks: 2,
    }),
    question('9', SCIENCE, 'Exploration: Entering the World of Secondary Science', {
      type: 'MCQ',
      text: 'In science, a theory is __.',
      answer: 'An explanation based on evidence and careful testing',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'A guess that has not been tested', isCorrect: false },
        { text: 'An explanation based on evidence and careful testing', isCorrect: true },
        { text: 'A law that can never change', isCorrect: false },
        { text: 'A personal opinion', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Cell: The Building Block of Life', {
      type: 'MCQ',
      text: 'Most plant and animal cells are best seen with a __ microscope.',
      answer: 'Light',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Light', isCorrect: true },
        { text: 'Electron', isCorrect: false },
        { text: 'Telescope', isCorrect: false },
        { text: 'Spectroscope', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Cell: The Building Block of Life', {
      type: 'SHORT_ANSWER',
      text: 'How can you estimate the real size of a cell seen under a microscope?',
      answer: 'Place a transparent ruler on the stage, focus on it and measure the diameter of the circular field of view in millimetres. Convert it to micrometres, remove the ruler, focus on the onion peel slide, count the cells along the diameter of the field and divide the field diameter by that number.',
      marks: 2,
    }),
    question('9', SCIENCE, 'Cell: The Building Block of Life', {
      type: 'MCQ',
      text: 'The organelle called the powerhouse of the cell is the __.',
      answer: 'Mitochondrion',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Ribosome', isCorrect: false },
        { text: 'Mitochondrion', isCorrect: true },
        { text: 'Golgi apparatus', isCorrect: false },
        { text: 'Lysosome', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Cell: The Building Block of Life', {
      type: 'MCQ',
      text: 'Mitosis produces __ daughter cells from one parent cell.',
      answer: 'Two genetically identical',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'One', isCorrect: false },
        { text: 'Two genetically identical', isCorrect: true },
        { text: 'Four genetically identical', isCorrect: false },
        { text: 'Many unrelated', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Tissues in Action', {
      type: 'MCQ',
      text: 'The tissue that helps a plant grow in length is the __ meristem.',
      answer: 'Apical',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Apical', isCorrect: true },
        { text: 'Lateral', isCorrect: false },
        { text: 'Intercalary', isCorrect: false },
        { text: 'Permanent', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Tissues in Action', {
      type: 'MCQ',
      text: 'The annual growth rings seen in a cut tree trunk are produced by the __ meristem.',
      answer: 'Lateral',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Apical', isCorrect: false },
        { text: 'Lateral', isCorrect: true },
        { text: 'Intercalary', isCorrect: false },
        { text: 'Cambium of the root tip', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Tissues in Action', {
      type: 'MCQ',
      text: 'Tendons connect __.',
      answer: 'Muscles to bones',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Bone to bone', isCorrect: false },
        { text: 'Muscles to bones', isCorrect: true },
        { text: 'Nerve to muscle', isCorrect: false },
        { text: 'Skin to muscle', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Tissues in Action', {
      type: 'MCQ',
      text: 'The cells of nervous tissue are called __.',
      answer: 'Neurons',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Neurons', isCorrect: true },
        { text: 'Osteocytes', isCorrect: false },
        { text: 'Chondrocytes', isCorrect: false },
        { text: 'Epithelial cells', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Describing Motion Around Us', {
      type: 'MCQ',
      text: 'Displacement is different from distance because displacement has __.',
      answer: 'Direction as well as magnitude',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Direction as well as magnitude', isCorrect: true },
        { text: 'Only magnitude', isCorrect: false },
        { text: 'No unit', isCorrect: false },
        { text: 'No reference point', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Describing Motion Around Us', {
      type: 'MCQ',
      text: 'An athlete runs 160 m once around a circular track and returns to the starting point. Her displacement is __.',
      answer: '0 m',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '160 m', isCorrect: false },
        { text: '0 m', isCorrect: true },
        { text: '80 m', isCorrect: false },
        { text: '320 m', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Describing Motion Around Us', {
      type: 'SHORT_ANSWER',
      text: 'Write the three kinematic equations used for motion in a straight line with constant acceleration.',
      answer: 'v = u + at, where u is the initial velocity, v the final velocity, a the acceleration and t the time; s = ut + (1/2) a t squared, where s is the displacement; and v squared = u squared + 2as.',
      marks: 2,
    }),
    question('9', SCIENCE, 'Exploring Mixtures and their Separation', {
      type: 'MCQ',
      text: 'A well-stirred mixture of salt and water is a __ mixture.',
      answer: 'Homogeneous',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Homogeneous', isCorrect: true },
        { text: 'Heterogeneous', isCorrect: false },
        { text: 'Colloidal', isCorrect: false },
        { text: 'Suspension', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Exploring Mixtures and their Separation', {
      type: 'MCQ',
      text: 'The maximum amount of solute that dissolves in a fixed quantity of solvent at a given temperature is its __.',
      answer: 'Solubility',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Concentration', isCorrect: false },
        { text: 'Solubility', isCorrect: true },
        { text: 'Density', isCorrect: false },
        { text: 'Volatility', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Exploring Mixtures and their Separation', {
      type: 'MCQ',
      text: 'The scattering of a beam of light by the particles of a colloid is called the __ effect.',
      answer: 'Tyndall',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Tyndall', isCorrect: true },
        { text: 'Mirage', isCorrect: false },
        { text: 'Refraction', isCorrect: false },
        { text: 'Dispersion', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Orienting Yourself: The Use of Coordinates', {
      type: 'MCQ',
      text: 'The coordinates of the origin O are __.',
      answer: '(0, 0)',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '(0, 0)', isCorrect: true },
        { text: '(1, 1)', isCorrect: false },
        { text: '(0, 1)', isCorrect: false },
        { text: '(-1, 0)', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Orienting Yourself: The Use of Coordinates', {
      type: 'MCQ',
      text: 'A point on the x-axis 4.5 units to the right of the origin has coordinates __.',
      answer: '(4.5, 0)',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '(4.5, 0)', isCorrect: true },
        { text: '(0, 4.5)', isCorrect: false },
        { text: '(-4.5, 0)', isCorrect: false },
        { text: '(4.5, 4.5)', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Orienting Yourself: The Use of Coordinates', {
      type: 'SHORT_ANSWER',
      text: 'Find the distance between the points A(3, 4) and D(7, 1).',
      answer: 'The distance moved along the x-axis is 7 - 3 = 4 and along the y-axis it is 4 - 1 = 3. By the Baudhayana-Pythagoras theorem the distance AD = root of (4 squared + 3 squared) = root of 25 = 5 units.',
      marks: 2,
    }),
    question('9', MATHS, 'Introduction to Linear Polynomials', {
      type: 'MCQ',
      text: 'In the expression 4x + 5y + 3, the numbers 4 and 5 are called the __.',
      answer: 'Coefficients',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Constants', isCorrect: false },
        { text: 'Coefficients', isCorrect: true },
        { text: 'Exponents', isCorrect: false },
        { text: 'Terms', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Introduction to Linear Polynomials', {
      type: 'MCQ',
      text: 'The polynomial 3z + 7 has degree __.',
      answer: '1',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '0', isCorrect: false },
        { text: '1', isCorrect: true },
        { text: '2', isCorrect: false },
        { text: '3', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Introduction to Linear Polynomials', {
      type: 'MCQ',
      text: 'The graph of a linear polynomial in one variable is always a __.',
      answer: 'Straight line',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Circle', isCorrect: false },
        { text: 'Straight line', isCorrect: true },
        { text: 'Curve', isCorrect: false },
        { text: 'Hyperbola', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'The World of Numbers', {
      type: 'MCQ',
      text: 'The Lebombo bone carries an early record of __ carved on it.',
      answer: 'Tally marks',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Tally marks', isCorrect: true },
        { text: 'Cuneiform letters', isCorrect: false },
        { text: 'Decimal places', isCorrect: false },
        { text: 'Negative numbers', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'The World of Numbers', {
      type: 'MCQ',
      text: 'The Indian mathematician who formalised zero and negative numbers as algebraic entities was __.',
      answer: 'Brahmagupta',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Aryabhata', isCorrect: false },
        { text: 'Brahmagupta', isCorrect: true },
        { text: 'Madhava', isCorrect: false },
        { text: 'Baudhayana', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'The World of Numbers', {
      type: 'MCQ',
      text: 'The decimal expansion 0.142857142857... shows the cyclic number __.',
      answer: '142857',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '142857', isCorrect: true },
        { text: '428571', isCorrect: false },
        { text: '714285', isCorrect: false },
        { text: '857142', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Exploring Algebraic Identities', {
      type: 'MCQ',
      text: '(a + b) squared is equal to __.',
      answer: 'a squared + 2ab + b squared',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'a squared + b squared', isCorrect: false },
        { text: 'a squared + 2ab + b squared', isCorrect: true },
        { text: 'a squared - 2ab + b squared', isCorrect: false },
        { text: '2a + 2b', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Exploring Algebraic Identities', {
      type: 'MCQ',
      text: 'Using the identity (x + a)(x + b), the expression x squared + 7x + 12 can be written as __.',
      answer: '(x + 3)(x + 4)',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '(x + 3)(x + 4)', isCorrect: true },
        { text: '(x - 3)(x - 4)', isCorrect: false },
        { text: '(x + 2)(x + 6)', isCorrect: false },
        { text: '(x + 1)(x + 12)', isCorrect: false },
      ],
    }),
    question('9', MATHS, 'Exploring Algebraic Identities', {
      type: 'SHORT_ANSWER',
      text: 'How can you simplify a rational expression in which the numerator and the denominator have a common factor?',
      answer: 'Cancel the common factor from the numerator and the denominator, so that the expression is left in its simplest form.',
      marks: 2,
    }),
  ];

  const QUESTION_CONCEPT: Record<string, string> = {
    "State the two laws of chemical combination.": "Dalton's Theory",
    'Which of the following is an example of a combination reaction?': 'Combination and Decomposition',
    'Write the balanced chemical equation for the reaction of zinc with dilute sulphuric acid.': 'Displacement Reactions',
    'Which indicator turns red in acidic solution?': 'Litmus Test',
    'What happens when sodium hydroxide reacts with hydrochloric acid?': 'Neutralisation',
    'The angle of incidence is equal to the angle of __.': 'Laws of Reflection',
    'The SI unit of electric current is __.': "Ohm's Law",
    'State Ohm\'s law and write its mathematical form.': "Ohm's Law",
    'HCF of 12 and 18 is __.': 'HCF',
    'A polynomial of degree 2 is called __.': 'Degree',
    'Solve: x^2 - 5x + 6 = 0': 'Factoring',
    'sin 30 degrees = ?': 'Values of Standard Angles',
    'Find the 10th term of the AP: 2, 5, 8, 11, ...': 'nth Term of an AP',
    'The median of the data 3, 5, 7, 9, 11 is __.': 'Mean, Median, Mode',
    'What is the probability of getting a head when tossing a coin?': 'Favourable Outcomes',
    'Which of the following is a non-metal?': 'Lustre, Conductivity',
    'The general formula of alkanes is __.': 'Hydrocarbons',
    'Name the organ where urea is formed in the human body.': 'Digestion',
    'Which part of the brain controls voluntary actions?': 'Neurons',
    'What is the genotype of a tall plant (T) if it is heterozygous?': 'Dominant and Recessive',
    'The least distance of distinct vision for a normal eye is __.': 'Defects of Vision',
    'The magnetic field around a straight current-carrying conductor is __.': 'Field Lines',
    'What is the role of decomposers in an ecosystem?': 'Food Chains',
    'Solve: x + y = 5 and x - y = 1': 'Substitution and Elimination',
    'In similar triangles, the ratio of corresponding sides is __.': 'AA, SAS, SSS Criteria',
    'Find the distance between points (1, 2) and (4, 6).': 'Distance Between Points',
    'The tangent at any point of a circle is perpendicular to the __.': 'Tangent to a Circle',
    'Find the curved surface area of a cylinder with radius 7 cm and height 10 cm.': 'Cylinder, Cone, Sphere',
    "The atomic number of an element is equal to the number of __.": 'Atomic Number',
    'In the puri investigation, which of these is something you can measure?': 'Asking a Scientific Question',
    'Why should you change only one thing at a time while doing an experiment?': 'Controlled Variables in an Experiment',
    'Which is the best record to keep while investigating?': 'Recording Data and Making Sense of It',
    'Which part of the cell controls all its activities?': 'Cell Membrane, Cytoplasm and Nucleus',
    'Which scientist first observed cells in thin slices of cork in 1665?': 'Cell Wall, Plastids and Vacuole',
    'Which is the correct order of levels of organisation?': 'Levels of Organisation from Cell to Organism',
    'According to the WHO, health is a state of complete __.': 'Physical, Mental and Social Well-being',
    'Diabetes is an example of a __ disease.': 'Communicable and Non-communicable Diseases',
    'Why must an antibiotic course be completed fully instead of being stopped as soon as you feel better?': 'Vaccines, Antibiotics and Antibiotic Resistance',
    'Which of the following is a perfect square?': 'Perfect Squares',
    'The sum of the first n odd numbers is equal to __.': 'Patterns of Squares and Square Roots',
    'The cube root of 125 is 5. Explain how you can check that this is correct.': 'Perfect Cubes and Cube Roots',
    'In the expression 5 to the power 4 = 625, the number 4 is called the __.': 'Powers and Exponential Form',
    'Using the laws of exponents, 4 to the power 6 multiplied by 4 to the power 3 equals __.': 'Laws of Exponents',
    'The standard (scientific) form of 20800 is __.': 'Powers of 10 and Scientific Notation',
    'The earliest physical evidence of people recording numbers is a set of __ carved on bone.': 'Tally Marks and Counting in Groups',
    'The landmark numbers of the Roman numeral system are I, V, X, L, C, D and __.': 'Roman Numerals',
    'What is the idea of a base in a number system, and why does it make multiplication easy?': 'Base-n Number Systems',
    'A scientific model is a __ way of looking at a real system.': 'Models and Simplification',
    'In making a simple model of a cricket shot for a six, which details would you keep and which would you ignore?': 'Models and Simplification',
    'In science, a theory is __.': 'Laws, Theories and Principles',
    'Most plant and animal cells are best seen with a __ microscope.': 'Microscopes, Magnification and Cell Size',
    'How can you estimate the real size of a cell seen under a microscope?': 'Microscopes, Magnification and Cell Size',
    'The organelle called the powerhouse of the cell is the __.': 'Cell Membrane, Cell Wall and Cell Organelles',
    'Mitosis produces __ daughter cells from one parent cell.': 'Mitosis, Meiosis and Cell Division',
    'The tissue that helps a plant grow in length is the __ meristem.': 'Meristematic Tissues in Plants',
    'The annual growth rings seen in a cut tree trunk are produced by the __ meristem.': 'Meristematic Tissues in Plants',
    'Tendons connect __.': 'Epithelial, Connective, Muscular and Nervous Tissues',
    'The cells of nervous tissue are called __.': 'Epithelial, Connective, Muscular and Nervous Tissues',
    'Displacement is different from distance because displacement has __.': 'Position, Distance and Displacement',
    'An athlete runs 160 m once around a circular track and returns to the starting point. Her displacement is __.': 'Position, Distance and Displacement',
    'Write the three kinematic equations used for motion in a straight line with constant acceleration.': 'Kinematic Equations and Uniform Circular Motion',
    'A well-stirred mixture of salt and water is a __ mixture.': 'Homogeneous and Heterogeneous Mixtures',
    'The maximum amount of solute that dissolves in a fixed quantity of solvent at a given temperature is its __.': 'Concentration and Solubility',
    'The scattering of a beam of light by the particles of a colloid is called the __ effect.': 'Immiscible Liquids, Sublimation, Suspensions and Colloids',
    'The coordinates of the origin O are __.': 'Axes, Origin and Coordinates',
    'A point on the x-axis 4.5 units to the right of the origin has coordinates __.': 'Axes, Origin and Coordinates',
    'Find the distance between the points A(3, 4) and D(7, 1).': 'The Distance Formula',
    'In the expression 4x + 5y + 3, the numbers 4 and 5 are called the __.': 'Algebraic Expressions, Variables and Coefficients',
    'The polynomial 3z + 7 has degree __.': 'Linear Polynomials and the Degree of a Polynomial',
    'The graph of a linear polynomial in one variable is always a __.': 'Visualising Linear Relationships with Graphs',
    'The Lebombo bone carries an early record of __ carved on it.': 'Early Counting Systems and One-to-One Correspondence',
    'The Indian mathematician who formalised zero and negative numbers as algebraic entities was __.': 'Zero, the Bakhshali Manuscript and Brahmagupta’s Rules',
    'The decimal expansion 0.142857142857... shows the cyclic number __.': 'Irrational Numbers, Decimals and Cyclic Numbers',
    '(a + b) squared is equal to __.': 'Standard Algebraic Identities',
    'Using the identity (x + a)(x + b), the expression x squared + 7x + 12 can be written as __.': 'Factorisation Using Identities and Algebra Tiles',
    'How can you simplify a rational expression in which the numerator and the denominator have a common factor?': 'Simplifying Rational Expressions',
  };

  const specQuestions = [...scienceQuestions].map((q) => q as typeof q & { conceptId: string | null });
  for (const q of specQuestions) {
    const chapterKey = CHAPTER_KEY_BY_ID[q.chapterId];
    const conceptName = QUESTION_CONCEPT[q.text];
    const conceptId = conceptName ? CONCEPT_IDS[chapterKey]?.[conceptName] : undefined;
    if (!conceptId) {
      throw new Error(`Seed question has no concept mapping: ${q.text} (chapter ${chapterKey}, concept "${conceptName ?? ''}")`);
    }
    q.conceptId = conceptId;
  }

  for (const q of specQuestions) {
    const exists = await prisma.question.findFirst({
      where: { text: q.text, boardId: BOARD.id },
    });
    if (!exists) {
      await prisma.question.create({ data: q });
    } else if (exists.conceptId !== q.conceptId || exists.chapterId !== q.chapterId || exists.grade !== q.grade) {
      await prisma.question.update({
        where: { id: exists.id },
        data: { grade: q.grade, chapterId: q.chapterId, conceptId: q.conceptId },
      });
    }
  }

  const seededTexts = new Set(specQuestions.map((q) => q.text));
  const staleSeeded = await prisma.question.findMany({
    where: { boardId: BOARD.id, status: 'APPROVED', source: 'SEED' },
  });
  for (const stale of staleSeeded) {
    if (!seededTexts.has(stale.text)) {
      try {
        await prisma.question.delete({ where: { id: stale.id } });
      } catch {
        await prisma.question.update({
          where: { id: stale.id },
          data: { conceptId: null },
        });
      }
    }
  }

  const contentNodes = [
    { ch: 'Plants and Animals', subjectName: SCIENCE, grade: '1', concept: 'Root, Stem, Leaves', type: 'VIDEO', title: 'Plants and Animals - Video Lesson', duration: 1462 },
    { ch: 'Plants and Animals', subjectName: SCIENCE, grade: '1', concept: 'Root, Stem, Leaves', type: 'NOTES', title: 'Plants and Animals - Study Notes', duration: 420 },
    { ch: 'Our Body and Food', subjectName: SCIENCE, grade: '1', concept: 'Senses', type: 'VIDEO', title: 'Our Body and Food - Video Lesson', duration: 1154 },
    { ch: 'Our Body and Food', subjectName: SCIENCE, grade: '1', concept: 'Senses', type: 'NOTES', title: 'Our Body and Food - Study Notes', duration: 420 },
    { ch: 'Numbers up to 100', subjectName: MATHS, grade: '1', concept: 'Before and After', type: 'VIDEO', title: 'Numbers up to 100 - Video Lesson', duration: 501 },
    { ch: 'Numbers up to 100', subjectName: MATHS, grade: '1', concept: 'Before and After', type: 'NOTES', title: 'Numbers up to 100 - Study Notes', duration: 420 },
    { ch: 'Shapes and Patterns', subjectName: MATHS, grade: '1', concept: 'Circle, Square, Triangle', type: 'VIDEO', title: 'Shapes and Patterns - Video Lesson', duration: 598 },
    { ch: 'Shapes and Patterns', subjectName: MATHS, grade: '1', concept: 'Circle, Square, Triangle', type: 'NOTES', title: 'Shapes and Patterns - Study Notes', duration: 420 },
    { ch: 'Plants Around Us', subjectName: SCIENCE, grade: '2', concept: 'Trees, Shrubs, Herbs', type: 'VIDEO', title: 'Plants Around Us - Video Lesson', duration: 204 },
    { ch: 'Plants Around Us', subjectName: SCIENCE, grade: '2', concept: 'Trees, Shrubs, Herbs', type: 'NOTES', title: 'Plants Around Us - Study Notes', duration: 420 },
    { ch: 'Animals and Their Young', subjectName: SCIENCE, grade: '2', concept: 'Egg to Adult', type: 'VIDEO', title: 'Animals and Their Young - Video Lesson', duration: 413 },
    { ch: 'Animals and Their Young', subjectName: SCIENCE, grade: '2', concept: 'Egg to Adult', type: 'NOTES', title: 'Animals and Their Young - Study Notes', duration: 420 },
    { ch: 'Numbers up to 1000', subjectName: MATHS, grade: '2', concept: 'Hundreds, Tens, Ones', type: 'VIDEO', title: 'Numbers up to 1000 - Video Lesson', duration: 311 },
    { ch: 'Numbers up to 1000', subjectName: MATHS, grade: '2', concept: 'Hundreds, Tens, Ones', type: 'NOTES', title: 'Numbers up to 1000 - Study Notes', duration: 420 },
    { ch: 'Introduction to Multiplication', subjectName: MATHS, grade: '2', concept: 'Repeated Addition', type: 'VIDEO', title: 'Introduction to Multiplication - Video Lesson', duration: 305 },
    { ch: 'Introduction to Multiplication', subjectName: MATHS, grade: '2', concept: 'Repeated Addition', type: 'NOTES', title: 'Introduction to Multiplication - Study Notes', duration: 420 },
    { ch: 'The World of Plants', subjectName: SCIENCE, grade: '3', concept: 'Germination', type: 'VIDEO', title: 'The World of Plants - Video Lesson', duration: 211 },
    { ch: 'The World of Plants', subjectName: SCIENCE, grade: '3', concept: 'Germination', type: 'NOTES', title: 'The World of Plants - Study Notes', duration: 420 },
    { ch: 'The Human Body', subjectName: SCIENCE, grade: '3', concept: 'Bones and Joints', type: 'VIDEO', title: 'The Human Body - Video Lesson', duration: 2280 },
    { ch: 'The Human Body', subjectName: SCIENCE, grade: '3', concept: 'Bones and Joints', type: 'NOTES', title: 'The Human Body - Study Notes', duration: 420 },
    { ch: 'Properties of Materials', subjectName: SCIENCE, grade: '3', concept: 'Hard and Soft', type: 'VIDEO', title: 'Properties of Materials - Video Lesson', duration: 374 },
    { ch: 'Properties of Materials', subjectName: SCIENCE, grade: '3', concept: 'Hard and Soft', type: 'NOTES', title: 'Properties of Materials - Study Notes', duration: 420 },
    { ch: 'Numbers up to 10000', subjectName: MATHS, grade: '3', concept: 'Thousands and Hundreds', type: 'VIDEO', title: 'Numbers up to 10000 - Video Lesson', duration: 625 },
    { ch: 'Numbers up to 10000', subjectName: MATHS, grade: '3', concept: 'Thousands and Hundreds', type: 'NOTES', title: 'Numbers up to 10000 - Study Notes', duration: 420 },
    { ch: 'Multiplication and Division', subjectName: MATHS, grade: '3', concept: 'Two Digit Numbers', type: 'VIDEO', title: 'Multiplication and Division - Video Lesson', duration: 394 },
    { ch: 'Multiplication and Division', subjectName: MATHS, grade: '3', concept: 'Two Digit Numbers', type: 'NOTES', title: 'Multiplication and Division - Study Notes', duration: 420 },
    { ch: 'Food and Nutrition', subjectName: SCIENCE, grade: '4', concept: 'Carbohydrates, Proteins, Fats', type: 'VIDEO', title: 'Food and Nutrition - Video Lesson', duration: 837 },
    { ch: 'Food and Nutrition', subjectName: SCIENCE, grade: '4', concept: 'Carbohydrates, Proteins, Fats', type: 'NOTES', title: 'Food and Nutrition - Study Notes', duration: 420 },
    { ch: 'The Living World', subjectName: SCIENCE, grade: '4', concept: 'Land and Water Habitats', type: 'VIDEO', title: 'The Living World - Video Lesson', duration: 1011 },
    { ch: 'The Living World', subjectName: SCIENCE, grade: '4', concept: 'Land and Water Habitats', type: 'NOTES', title: 'The Living World - Study Notes', duration: 420 },
    { ch: 'Large Numbers', subjectName: MATHS, grade: '4', concept: 'Place Value', type: 'VIDEO', title: 'Large Numbers - Video Lesson', duration: 648 },
    { ch: 'Large Numbers', subjectName: MATHS, grade: '4', concept: 'Place Value', type: 'NOTES', title: 'Large Numbers - Study Notes', duration: 420 },
    { ch: 'Operations on Numbers', subjectName: MATHS, grade: '4', concept: 'Multi-digit', type: 'VIDEO', title: 'Operations on Numbers - Video Lesson', duration: 406 },
    { ch: 'Operations on Numbers', subjectName: MATHS, grade: '4', concept: 'Multi-digit', type: 'NOTES', title: 'Operations on Numbers - Study Notes', duration: 420 },
    { ch: 'The World of Living Things', subjectName: SCIENCE, grade: '5', concept: 'Butterfly, Frog, Plant', type: 'VIDEO', title: 'The World of Living Things - Video Lesson', duration: 370 },
    { ch: 'The World of Living Things', subjectName: SCIENCE, grade: '5', concept: 'Butterfly, Frog, Plant', type: 'NOTES', title: 'The World of Living Things - Study Notes', duration: 420 },
    { ch: 'Materials: Pure and Mixed', subjectName: SCIENCE, grade: '5', concept: 'Filtration, Evaporation', type: 'VIDEO', title: 'Materials: Pure and Mixed - Video Lesson', duration: 831 },
    { ch: 'Materials: Pure and Mixed', subjectName: SCIENCE, grade: '5', concept: 'Filtration, Evaporation', type: 'NOTES', title: 'Materials: Pure and Mixed - Study Notes', duration: 420 },
    { ch: 'Forces and Energy', subjectName: SCIENCE, grade: '5', concept: 'Lever, Pulley, Inclined Plane', type: 'VIDEO', title: 'Forces and Energy - Video Lesson', duration: 447 },
    { ch: 'Forces and Energy', subjectName: SCIENCE, grade: '5', concept: 'Lever, Pulley, Inclined Plane', type: 'NOTES', title: 'Forces and Energy - Study Notes', duration: 420 },
    { ch: 'Numbers and Operations', subjectName: MATHS, grade: '5', concept: 'Numbers up to Crores', type: 'VIDEO', title: 'Numbers and Operations - Video Lesson', duration: 830 },
    { ch: 'Numbers and Operations', subjectName: MATHS, grade: '5', concept: 'Numbers up to Crores', type: 'NOTES', title: 'Numbers and Operations - Study Notes', duration: 420 },
    { ch: 'Fractions and Decimals', subjectName: MATHS, grade: '5', concept: 'Addition and Subtraction', type: 'VIDEO', title: 'Fractions and Decimals - Video Lesson', duration: 3866 },
    { ch: 'Fractions and Decimals', subjectName: MATHS, grade: '5', concept: 'Addition and Subtraction', type: 'NOTES', title: 'Fractions and Decimals - Study Notes', duration: 420 },
    { ch: 'Geometry and Mensuration', subjectName: MATHS, grade: '5', concept: 'Cube, Cuboid, Cylinder', type: 'VIDEO', title: 'Geometry and Mensuration - Video Lesson', duration: 724 },
    { ch: 'Geometry and Mensuration', subjectName: MATHS, grade: '5', concept: 'Cube, Cuboid, Cylinder', type: 'NOTES', title: 'Geometry and Mensuration - Study Notes', duration: 420 },
    { ch: 'The World of the Living', subjectName: SCIENCE, grade: '6', concept: 'Kingdoms', type: 'VIDEO', title: 'The World of the Living - Video Lesson', duration: 1516 },
    { ch: 'The World of the Living', subjectName: SCIENCE, grade: '6', concept: 'Kingdoms', type: 'NOTES', title: 'The World of the Living - Study Notes', duration: 420 },
    { ch: 'Body Movements', subjectName: SCIENCE, grade: '6', concept: 'Bones and Muscles', type: 'VIDEO', title: 'Body Movements - Video Lesson', duration: 155 },
    { ch: 'Body Movements', subjectName: SCIENCE, grade: '6', concept: 'Bones and Muscles', type: 'NOTES', title: 'Body Movements - Study Notes', duration: 420 },
    { ch: 'Basic Geometrical Ideas', subjectName: MATHS, grade: '6', concept: 'Line Segments', type: 'VIDEO', title: 'Basic Geometrical Ideas - Video Lesson', duration: 317 },
    { ch: 'Basic Geometrical Ideas', subjectName: MATHS, grade: '6', concept: 'Line Segments', type: 'NOTES', title: 'Basic Geometrical Ideas - Study Notes', duration: 420 },
    { ch: 'Integers', subjectName: MATHS, grade: '6', concept: 'Number Line', type: 'VIDEO', title: 'Integers - Video Lesson', duration: 2214 },
    { ch: 'Integers', subjectName: MATHS, grade: '6', concept: 'Number Line', type: 'NOTES', title: 'Integers - Study Notes', duration: 420 },
    { ch: 'Algebra', subjectName: MATHS, grade: '6', concept: 'Using Letters', type: 'VIDEO', title: 'Algebra - Video Lesson', duration: 1294 },
    { ch: 'Algebra', subjectName: MATHS, grade: '6', concept: 'Using Letters', type: 'NOTES', title: 'Algebra - Study Notes', duration: 420 },
    { ch: 'Nutrition in Living Organisms', subjectName: SCIENCE, grade: '7', concept: 'Photosynthesis', type: 'VIDEO', title: 'Nutrition in Living Organisms - Video Lesson', duration: 2314 },
    { ch: 'Nutrition in Living Organisms', subjectName: SCIENCE, grade: '7', concept: 'Photosynthesis', type: 'NOTES', title: 'Nutrition in Living Organisms - Study Notes', duration: 420 },
    { ch: 'Heat and Temperature', subjectName: SCIENCE, grade: '7', concept: 'Conduction, Convection, Radiation', type: 'VIDEO', title: 'Heat and Temperature - Video Lesson', duration: 195 },
    { ch: 'Heat and Temperature', subjectName: SCIENCE, grade: '7', concept: 'Conduction, Convection, Radiation', type: 'NOTES', title: 'Heat and Temperature - Study Notes', duration: 420 },
    { ch: 'Electric Current and Circuits', subjectName: SCIENCE, grade: '7', concept: 'Components', type: 'VIDEO', title: 'Electric Current and Circuits - Video Lesson', duration: 1226 },
    { ch: 'Electric Current and Circuits', subjectName: SCIENCE, grade: '7', concept: 'Components', type: 'NOTES', title: 'Electric Current and Circuits - Study Notes', duration: 420 },
    { ch: 'Integers and Fractions', subjectName: MATHS, grade: '7', concept: 'Multiplication and Division', type: 'VIDEO', title: 'Integers and Fractions - Video Lesson', duration: 3940 },
    { ch: 'Integers and Fractions', subjectName: MATHS, grade: '7', concept: 'Multiplication and Division', type: 'NOTES', title: 'Integers and Fractions - Study Notes', duration: 420 },
    { ch: 'Linear Equations', subjectName: MATHS, grade: '7', concept: 'Solving for Unknown', type: 'VIDEO', title: 'Linear Equations - Video Lesson', duration: 680 },
    { ch: 'Linear Equations', subjectName: MATHS, grade: '7', concept: 'Solving for Unknown', type: 'NOTES', title: 'Linear Equations - Study Notes', duration: 420 },
    { ch: 'Geometry', subjectName: MATHS, grade: '7', concept: 'Types by Angles', type: 'VIDEO', title: 'Geometry - Video Lesson', duration: 1105 },
    { ch: 'Geometry', subjectName: MATHS, grade: '7', concept: 'Types by Angles', type: 'NOTES', title: 'Geometry - Study Notes', duration: 420 },

    { ch: 'Exploration: Entering the World of Secondary Science', subjectName: SCIENCE, grade: '9', concept: 'Models and Simplification', type: 'VIDEO', title: 'Exploration: Entering the World of Secondary Science - Video Lesson', duration: 461 },
    { ch: 'Exploration: Entering the World of Secondary Science', subjectName: SCIENCE, grade: '9', concept: 'Models and Simplification', type: 'NOTES', title: 'Exploration: Entering the World of Secondary Science - Study Notes', duration: 420 },
    { ch: 'Cell: The Building Block of Life', subjectName: SCIENCE, grade: '9', concept: 'Microscopes, Magnification and Cell Size', type: 'VIDEO', title: 'Cell: The Building Block of Life - Video Lesson', duration: 790 },
    { ch: 'Cell: The Building Block of Life', subjectName: SCIENCE, grade: '9', concept: 'Microscopes, Magnification and Cell Size', type: 'NOTES', title: 'Cell: The Building Block of Life - Study Notes', duration: 420 },
    { ch: 'Tissues in Action', subjectName: SCIENCE, grade: '9', concept: 'Meristematic Tissues in Plants', type: 'VIDEO', title: 'Tissues in Action - Video Lesson', duration: 656 },
    { ch: 'Tissues in Action', subjectName: SCIENCE, grade: '9', concept: 'Meristematic Tissues in Plants', type: 'NOTES', title: 'Tissues in Action - Study Notes', duration: 420 },
    { ch: 'Describing Motion Around Us', subjectName: SCIENCE, grade: '9', concept: 'Position, Distance and Displacement', type: 'VIDEO', title: 'Describing Motion Around Us - Video Lesson', duration: 179 },
    { ch: 'Describing Motion Around Us', subjectName: SCIENCE, grade: '9', concept: 'Position, Distance and Displacement', type: 'NOTES', title: 'Describing Motion Around Us - Study Notes', duration: 420 },
    { ch: 'Exploring Mixtures and their Separation', subjectName: SCIENCE, grade: '9', concept: 'Homogeneous and Heterogeneous Mixtures', type: 'VIDEO', title: 'Exploring Mixtures and their Separation - Video Lesson', duration: 1177 },
    { ch: 'Exploring Mixtures and their Separation', subjectName: SCIENCE, grade: '9', concept: 'Homogeneous and Heterogeneous Mixtures', type: 'NOTES', title: 'Exploring Mixtures and their Separation - Study Notes', duration: 420 },
    { ch: 'Orienting Yourself: The Use of Coordinates', subjectName: MATHS, grade: '9', concept: 'Axes, Origin and Coordinates', type: 'VIDEO', title: 'Orienting Yourself: The Use of Coordinates - Video Lesson', duration: 1411 },
    { ch: 'Orienting Yourself: The Use of Coordinates', subjectName: MATHS, grade: '9', concept: 'Axes, Origin and Coordinates', type: 'NOTES', title: 'Orienting Yourself: The Use of Coordinates - Study Notes', duration: 420 },
    { ch: 'Introduction to Linear Polynomials', subjectName: MATHS, grade: '9', concept: 'Algebraic Expressions, Variables and Coefficients', type: 'VIDEO', title: 'Introduction to Linear Polynomials - Video Lesson', duration: 1707 },
    { ch: 'Introduction to Linear Polynomials', subjectName: MATHS, grade: '9', concept: 'Algebraic Expressions, Variables and Coefficients', type: 'NOTES', title: 'Introduction to Linear Polynomials - Study Notes', duration: 420 },
    { ch: 'The World of Numbers', subjectName: MATHS, grade: '9', concept: 'Early Counting Systems and One-to-One Correspondence', type: 'VIDEO', title: 'The World of Numbers - Video Lesson', duration: 1104 },
    { ch: 'The World of Numbers', subjectName: MATHS, grade: '9', concept: 'Early Counting Systems and One-to-One Correspondence', type: 'NOTES', title: 'The World of Numbers - Study Notes', duration: 420 },
    { ch: 'Exploring Algebraic Identities', subjectName: MATHS, grade: '9', concept: 'Standard Algebraic Identities', type: 'VIDEO', title: 'Exploring Algebraic Identities - Video Lesson', duration: 1780 },
    { ch: 'Exploring Algebraic Identities', subjectName: MATHS, grade: '9', concept: 'Standard Algebraic Identities', type: 'NOTES', title: 'Exploring Algebraic Identities - Study Notes', duration: 420 },


    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Combination and Decomposition', type: 'VIDEO', title: 'Types of Chemical Reactions', duration: 769 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Combination and Decomposition', type: 'NOTES', title: 'Chemical Reactions - Complete Guide', duration: 420 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Law of Conservation of Mass', type: 'VIDEO', title: 'Balancing Chemical Equations', duration: 387 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Law of Conservation of Mass', type: 'NOTES', title: 'Balancing Equations - Practice Problems', duration: 350 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Litmus Test', type: 'VIDEO', title: 'Properties of Acids and Bases', duration: 1077 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Litmus Test', type: 'NOTES', title: 'Acids and Bases - Study Notes', duration: 380 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Measuring pH', type: 'VIDEO', title: 'pH Scale Explained', duration: 1077 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Measuring pH', type: 'NOTES', title: 'pH Scale and Neutralisation', duration: 320 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Lustre, Conductivity', type: 'VIDEO', title: 'Physical Properties of Metals', duration: 1113 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Lustre, Conductivity', type: 'NOTES', title: 'Metals vs Non-metals', duration: 350 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Reactivity Series', type: 'VIDEO', title: 'Reactivity Series of Metals', duration: 302 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Reactivity Series', type: 'NOTES', title: 'Metallurgy and Reactivity', duration: 300 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Electron Sharing', type: 'VIDEO', title: 'Covalent Bonding in Carbon', duration: 16398 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Electron Sharing', type: 'NOTES', title: 'Carbon Bonding - Detailed Notes', duration: 400 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Alcohols, Aldehydes', type: 'VIDEO', title: 'Functional Groups Explained', duration: 2314 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Alcohols, Aldehydes', type: 'NOTES', title: 'Organic Chemistry - Functional Groups', duration: 350 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Autotrophic and Heterotrophic', type: 'VIDEO', title: 'Nutrition in Living Organisms', duration: 296 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Autotrophic and Heterotrophic', type: 'NOTES', title: 'Modes of Nutrition', duration: 400 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Circulatory System', type: 'VIDEO', title: 'Transport in Humans', duration: 3909 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Circulatory System', type: 'NOTES', title: 'Circulatory System - Notes', duration: 350 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Laws of Reflection', type: 'VIDEO', title: 'Reflection of Light', duration: 2926 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Laws of Reflection', type: 'NOTES', title: 'Laws of Reflection - Summary', duration: 380 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Snell\'s Law', type: 'VIDEO', title: 'Refraction and Snell\'s Law', duration: 504 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Snell\'s Law', type: 'NOTES', title: 'Refraction - Formulas and Examples', duration: 350 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Ohm\'s Law', type: 'VIDEO', title: 'Ohm\'s Law Explained', duration: 1377 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Ohm\'s Law', type: 'NOTES', title: 'Ohm\'s Law and Resistance', duration: 350 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Heating Effect', type: 'VIDEO', title: 'Electric Power and Energy', duration: 1715 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Heating Effect', type: 'NOTES', title: 'Power, Energy, Joule\'s Law', duration: 320 },
    { ch: 'Control and Coordination', subjectName: SCIENCE, grade: '10', concept: 'Neurons', type: 'VIDEO', title: 'Control and Coordination - Video Lesson', duration: 259 },
    { ch: 'Control and Coordination', subjectName: SCIENCE, grade: '10', concept: 'Neurons', type: 'NOTES', title: 'Control and Coordination - Study Notes', duration: 420 },
    { ch: 'How do Organisms Reproduce?', subjectName: SCIENCE, grade: '10', concept: 'Binary Fission', type: 'VIDEO', title: 'How do Organisms Reproduce? - Video Lesson', duration: 585 },
    { ch: 'How do Organisms Reproduce?', subjectName: SCIENCE, grade: '10', concept: 'Binary Fission', type: 'NOTES', title: 'How do Organisms Reproduce? - Study Notes', duration: 420 },
    { ch: 'Heredity and Evolution', subjectName: SCIENCE, grade: '10', concept: 'Dominant and Recessive', type: 'VIDEO', title: 'Heredity and Evolution - Video Lesson', duration: 1336 },
    { ch: 'Heredity and Evolution', subjectName: SCIENCE, grade: '10', concept: 'Dominant and Recessive', type: 'NOTES', title: 'Heredity and Evolution - Study Notes', duration: 420 },
    { ch: 'Human Eye and Colourful World', subjectName: SCIENCE, grade: '10', concept: 'Retina, Lens', type: 'VIDEO', title: 'Human Eye and Colourful World - Video Lesson', duration: 5905 },
    { ch: 'Human Eye and Colourful World', subjectName: SCIENCE, grade: '10', concept: 'Retina, Lens', type: 'NOTES', title: 'Human Eye and Colourful World - Study Notes', duration: 420 },
    { ch: 'Magnetic Effects of Electric Current', subjectName: SCIENCE, grade: '10', concept: 'Field Lines', type: 'VIDEO', title: 'Magnetic Effects of Electric Current - Video Lesson', duration: 5358 },
    { ch: 'Magnetic Effects of Electric Current', subjectName: SCIENCE, grade: '10', concept: 'Field Lines', type: 'NOTES', title: 'Magnetic Effects of Electric Current - Study Notes', duration: 420 },
    { ch: 'Our Environment', subjectName: SCIENCE, grade: '10', concept: 'Food Chains', type: 'VIDEO', title: 'Our Environment - Video Lesson', duration: 455 },
    { ch: 'Our Environment', subjectName: SCIENCE, grade: '10', concept: 'Food Chains', type: 'NOTES', title: 'Our Environment - Study Notes', duration: 420 },

    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'HCF', type: 'VIDEO', title: 'Euclid\'s Division Lemma', duration: 1229 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'HCF', type: 'NOTES', title: 'HCF and LCM - Complete Guide', duration: 350 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'Decimal Expansion', type: 'VIDEO', title: 'Irrational Numbers and Decimals', duration: 3103 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'Decimal Expansion', type: 'NOTES', title: 'Real Numbers - Summary', duration: 300 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Graph', type: 'VIDEO', title: 'Zeroes and Graphs of Polynomials', duration: 1055 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Degree', type: 'NOTES', title: 'Polynomial Zeroes - Notes', duration: 350 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Division Algorithm', type: 'VIDEO', title: 'Division Algorithm for Polynomials', duration: 229 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Division Algorithm', type: 'NOTES', title: 'Remainder and Factor Theorem', duration: 300 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Factoring', type: 'VIDEO', title: 'Solving Quadratics by Factoring', duration: 1068 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Factoring', type: 'NOTES', title: 'Factoring Quadratics - Methods', duration: 350 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Quadratic Formula', type: 'VIDEO', title: 'Quadratic Formula Explained', duration: 1068 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Quadratic Formula', type: 'NOTES', title: 'Quadratic Formula and Discriminant', duration: 300 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'nth Term of an AP', type: 'VIDEO', title: 'Arithmetic Progression - nth Term', duration: 328 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'nth Term of an AP', type: 'NOTES', title: 'AP Formulas and Examples', duration: 350 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'Common Difference', type: 'VIDEO', title: 'Sum of n Terms of AP', duration: 708 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'Common Difference', type: 'NOTES', title: 'Sum of AP - Practice Problems', duration: 300 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Sine, Cosine, Tangent', type: 'VIDEO', title: 'Trigonometric Ratios Explained', duration: 498 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Sine, Cosine, Tangent', type: 'NOTES', title: 'Trigonometry - Ratios and Table', duration: 400 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Pythagorean Identity', type: 'VIDEO', title: 'Trigonometric Identities', duration: 1583 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Pythagorean Identity', type: 'NOTES', title: 'Important Trig Identities', duration: 350 },
    { ch: 'Statistics', subjectName: MATHS, grade: '10', concept: 'Mean, Median, Mode', type: 'VIDEO', title: 'Mean, Median, Mode for Grouped Data', duration: 1631 },
    { ch: 'Statistics', subjectName: MATHS, grade: '10', concept: 'Mean, Median, Mode', type: 'NOTES', title: 'Central Tendency - Formulas', duration: 380 },
    { ch: 'Probability', subjectName: MATHS, grade: '10', concept: 'Favourable Outcomes', type: 'VIDEO', title: 'Classical Probability', duration: 526 },
    { ch: 'Probability', subjectName: MATHS, grade: '10', concept: 'Favourable Outcomes', type: 'NOTES', title: 'Probability - Basic Concepts', duration: 300 },
    { ch: 'Triangles', subjectName: MATHS, grade: '10', concept: 'AA, SAS, SSS Criteria', type: 'VIDEO', title: 'Similarity of Triangles', duration: 4466 },
    { ch: 'Triangles', subjectName: MATHS, grade: '10', concept: 'AA, SAS, SSS Criteria', type: 'NOTES', title: 'Similarity Criteria - Notes', duration: 350 },
    { ch: 'Coordinate Geometry', subjectName: MATHS, grade: '10', concept: 'Distance Between Points', type: 'VIDEO', title: 'Distance and Section Formula', duration: 3882 },
    { ch: 'Coordinate Geometry', subjectName: MATHS, grade: '10', concept: 'Distance Between Points', type: 'NOTES', title: 'Coordinate Geometry Formulas', duration: 300 },
    { ch: 'Circles', subjectName: MATHS, grade: '10', concept: 'Tangent to a Circle', type: 'VIDEO', title: 'Tangents to a Circle', duration: 903 },
    { ch: 'Circles', subjectName: MATHS, grade: '10', concept: 'Tangent to a Circle', type: 'NOTES', title: 'Circle Theorems - Summary', duration: 350 },
    { ch: 'Surface Areas and Volumes', subjectName: MATHS, grade: '10', concept: 'Cylinder, Cone, Sphere', type: 'VIDEO', title: 'Surface Areas and Volumes', duration: 13515 },
    { ch: 'Surface Areas and Volumes', subjectName: MATHS, grade: '10', concept: 'Cylinder, Cone, Sphere', type: 'NOTES', title: 'Mensuration Formulas', duration: 400 },
    { ch: 'Pair of Linear Equations in Two Variables', subjectName: MATHS, grade: '10', concept: 'Consistent and Inconsistent', type: 'VIDEO', title: 'Pair of Linear Equations in Two Variables - Video Lesson', duration: 567 },
    { ch: 'Pair of Linear Equations in Two Variables', subjectName: MATHS, grade: '10', concept: 'Consistent and Inconsistent', type: 'NOTES', title: 'Pair of Linear Equations in Two Variables - Study Notes', duration: 420 },
    { ch: 'Applications of Trigonometry', subjectName: MATHS, grade: '10', concept: 'Angle of Elevation', type: 'VIDEO', title: 'Applications of Trigonometry - Video Lesson', duration: 698 },
    { ch: 'Applications of Trigonometry', subjectName: MATHS, grade: '10', concept: 'Angle of Elevation', type: 'NOTES', title: 'Applications of Trigonometry - Study Notes', duration: 420 },
    { ch: 'Constructions', subjectName: MATHS, grade: '10', concept: 'Internal Division', type: 'VIDEO', title: 'Constructions - Video Lesson', duration: 304 },
    { ch: 'Constructions', subjectName: MATHS, grade: '10', concept: 'Internal Division', type: 'NOTES', title: 'Constructions - Study Notes', duration: 420 },
    { ch: 'Areas Related to Circles', subjectName: MATHS, grade: '10', concept: 'Arc Length', type: 'VIDEO', title: 'Areas Related to Circles - Video Lesson', duration: 8577 },
    { ch: 'Areas Related to Circles', subjectName: MATHS, grade: '10', concept: 'Arc Length', type: 'NOTES', title: 'Areas Related to Circles - Study Notes', duration: 420 },

    { ch: 'A Letter to God', subjectName: ENGLISH, grade: '10', concept: 'Lencho and the Ruined Harvest', type: 'VIDEO', title: 'A Letter to God - Video Lesson', duration: 550 },
    { ch: 'A Letter to God', subjectName: ENGLISH, grade: '10', concept: 'Lencho and the Ruined Harvest', type: 'NOTES', title: 'A Letter to God - Study Notes', duration: 420 },
    { ch: 'Nelson Mandela: Long Walk to Freedom', subjectName: ENGLISH, grade: '10', concept: 'Apartheid and the Struggle', type: 'VIDEO', title: 'Nelson Mandela: Long Walk to Freedom - Video Lesson', duration: 567 },
    { ch: 'Nelson Mandela: Long Walk to Freedom', subjectName: ENGLISH, grade: '10', concept: 'Apartheid and the Struggle', type: 'NOTES', title: 'Nelson Mandela: Long Walk to Freedom - Study Notes', duration: 420 },
    { ch: 'Two Stories about Flying', subjectName: ENGLISH, grade: '10', concept: 'His First Flight', type: 'VIDEO', title: 'Two Stories about Flying - Video Lesson', duration: 655 },
    { ch: 'Two Stories about Flying', subjectName: ENGLISH, grade: '10', concept: 'His First Flight', type: 'NOTES', title: 'Two Stories about Flying - Study Notes', duration: 420 },
    { ch: 'From the Diary of Anne Frank', subjectName: ENGLISH, grade: '10', concept: 'Anne Frank and the War', type: 'VIDEO', title: 'From the Diary of Anne Frank - Video Lesson', duration: 524 },
    { ch: 'From the Diary of Anne Frank', subjectName: ENGLISH, grade: '10', concept: 'Anne Frank and the War', type: 'NOTES', title: 'From the Diary of Anne Frank - Study Notes', duration: 420 },
    { ch: 'Glimpses of India', subjectName: ENGLISH, grade: '10', concept: 'A Baker from Goa', type: 'VIDEO', title: 'Glimpses of India - Video Lesson', duration: 2915 },
    { ch: 'Glimpses of India', subjectName: ENGLISH, grade: '10', concept: 'A Baker from Goa', type: 'NOTES', title: 'Glimpses of India - Study Notes', duration: 420 },
    { ch: 'Mijbil the Otter', subjectName: ENGLISH, grade: '10', concept: 'Gavin Maxwell and Mijbil', type: 'VIDEO', title: 'Mijbil the Otter - Video Lesson', duration: 4969 },
    { ch: 'Mijbil the Otter', subjectName: ENGLISH, grade: '10', concept: 'Gavin Maxwell and Mijbil', type: 'NOTES', title: 'Mijbil the Otter - Study Notes', duration: 420 },
    { ch: 'Madam Rides the Bus', subjectName: ENGLISH, grade: '10', concept: 'Valli and Her First Bus Ride', type: 'VIDEO', title: 'Madam Rides the Bus - Video Lesson', duration: 5712 },
    { ch: 'Madam Rides the Bus', subjectName: ENGLISH, grade: '10', concept: 'Valli and Her First Bus Ride', type: 'NOTES', title: 'Madam Rides the Bus - Study Notes', duration: 420 },
    { ch: 'The Sermon at Benares', subjectName: ENGLISH, grade: '10', concept: 'Gautama Buddha and Human Sorrows', type: 'VIDEO', title: 'The Sermon at Benares - Video Lesson', duration: 330 },
    { ch: 'The Sermon at Benares', subjectName: ENGLISH, grade: '10', concept: 'Gautama Buddha and Human Sorrows', type: 'NOTES', title: 'The Sermon at Benares - Study Notes', duration: 420 },
    { ch: 'The Proposal', subjectName: ENGLISH, grade: '10', concept: 'R, G and the Proposal', type: 'VIDEO', title: 'The Proposal - Video Lesson', duration: 1332 },
    { ch: 'The Proposal', subjectName: ENGLISH, grade: '10', concept: 'R, G and the Proposal', type: 'NOTES', title: 'The Proposal - Study Notes', duration: 420 },
    {ch: 'Exploring the Investigative World of Science', subjectName: SCIENCE, grade: '8', concept: 'Asking a Scientific Question', type: 'VIDEO', title: 'Exploring the Investigative World of Science - Video Lesson', duration: 991},
    {ch: 'Exploring the Investigative World of Science', subjectName: SCIENCE, grade: '8', concept: 'Asking a Scientific Question', type: 'NOTES', title: 'Exploring the Investigative World of Science - Study Notes', duration: 420},
    {ch: 'The Invisible Living World: Beyond Our Naked Eye', subjectName: SCIENCE, grade: '8', concept: 'Cell Membrane, Cytoplasm and Nucleus', type: 'VIDEO', title: 'The Invisible Living World: Beyond Our Naked Eye - Video Lesson', duration: 1234},
    {ch: 'The Invisible Living World: Beyond Our Naked Eye', subjectName: SCIENCE, grade: '8', concept: 'Cell Membrane, Cytoplasm and Nucleus', type: 'NOTES', title: 'The Invisible Living World: Beyond Our Naked Eye - Study Notes', duration: 420},
    {ch: 'Health: The Ultimate Treasure', subjectName: SCIENCE, grade: '8', concept: 'Physical, Mental and Social Well-being', type: 'VIDEO', title: 'Health: The Ultimate Treasure - Video Lesson', duration: 1079},
    {ch: 'Health: The Ultimate Treasure', subjectName: SCIENCE, grade: '8', concept: 'Physical, Mental and Social Well-being', type: 'NOTES', title: 'Health: The Ultimate Treasure - Study Notes', duration: 420},
    {ch: 'Electricity: Magnetic and Heating Effects', subjectName: SCIENCE, grade: '8', concept: 'Oersted’s Discovery and the Magnetic Field', type: 'VIDEO', title: 'Electricity: Magnetic and Heating Effects - Video Lesson', duration: 6513},
    {ch: 'Electricity: Magnetic and Heating Effects', subjectName: SCIENCE, grade: '8', concept: 'Oersted’s Discovery and the Magnetic Field', type: 'NOTES', title: 'Electricity: Magnetic and Heating Effects - Study Notes', duration: 420},
    {ch: 'Exploring Forces', subjectName: SCIENCE, grade: '8', concept: 'Push and Pull: What a Force Can Do', type: 'VIDEO', title: 'Exploring Forces - Video Lesson', duration: 914},
    {ch: 'Exploring Forces', subjectName: SCIENCE, grade: '8', concept: 'Push and Pull: What a Force Can Do', type: 'NOTES', title: 'Exploring Forces - Study Notes', duration: 420},
    {ch: 'Pressure, Winds, Storms, and Cyclones', subjectName: SCIENCE, grade: '8', concept: 'Pressure as Force per Unit Area', type: 'VIDEO', title: 'Pressure, Winds, Storms, and Cyclones - Video Lesson', duration: 2353},
    {ch: 'Pressure, Winds, Storms, and Cyclones', subjectName: SCIENCE, grade: '8', concept: 'Pressure as Force per Unit Area', type: 'NOTES', title: 'Pressure, Winds, Storms, and Cyclones - Study Notes', duration: 420},
    {ch: 'Particulate Nature of Matter', subjectName: SCIENCE, grade: '8', concept: 'Constituent Particles of Matter', type: 'VIDEO', title: 'Particulate Nature of Matter - Video Lesson', duration: 1000},
    {ch: 'Particulate Nature of Matter', subjectName: SCIENCE, grade: '8', concept: 'Constituent Particles of Matter', type: 'NOTES', title: 'Particulate Nature of Matter - Study Notes', duration: 420},
    {ch: 'Nature of Matter: Elements, Compounds, and Mixtures', subjectName: SCIENCE, grade: '8', concept: 'Uniform and Non-uniform Mixtures', type: 'VIDEO', title: 'Nature of Matter: Elements, Compounds, and Mixtures - Video Lesson', duration: 716},
    {ch: 'Nature of Matter: Elements, Compounds, and Mixtures', subjectName: SCIENCE, grade: '8', concept: 'Uniform and Non-uniform Mixtures', type: 'NOTES', title: 'Nature of Matter: Elements, Compounds, and Mixtures - Study Notes', duration: 420},
    {ch: 'The Amazing World of Solutes, Solvents, and Solutions', subjectName: SCIENCE, grade: '8', concept: 'Solute, Solvent and Solution', type: 'VIDEO', title: 'The Amazing World of Solutes, Solvents, and Solutions - Video Lesson', duration: 2440},
    {ch: 'The Amazing World of Solutes, Solvents, and Solutions', subjectName: SCIENCE, grade: '8', concept: 'Solute, Solvent and Solution', type: 'NOTES', title: 'The Amazing World of Solutes, Solvents, and Solutions - Study Notes', duration: 420},
    {ch: 'Light: Mirrors and Lenses', subjectName: SCIENCE, grade: '8', concept: 'Concave and Convex Mirrors', type: 'VIDEO', title: 'Light: Mirrors and Lenses - Video Lesson', duration: 837},
    {ch: 'Light: Mirrors and Lenses', subjectName: SCIENCE, grade: '8', concept: 'Concave and Convex Mirrors', type: 'NOTES', title: 'Light: Mirrors and Lenses - Study Notes', duration: 420},
    {ch: 'Keeping Time with the Skies', subjectName: SCIENCE, grade: '8', concept: 'Phases of the Moon', type: 'VIDEO', title: 'Keeping Time with the Skies - Video Lesson', duration: 1952},
    {ch: 'Keeping Time with the Skies', subjectName: SCIENCE, grade: '8', concept: 'Phases of the Moon', type: 'NOTES', title: 'Keeping Time with the Skies - Study Notes', duration: 420},
    {ch: 'How Nature Works in Harmony', subjectName: SCIENCE, grade: '8', concept: 'Biotic and Abiotic Components', type: 'VIDEO', title: 'How Nature Works in Harmony - Video Lesson', duration: 1962},
    {ch: 'How Nature Works in Harmony', subjectName: SCIENCE, grade: '8', concept: 'Biotic and Abiotic Components', type: 'NOTES', title: 'How Nature Works in Harmony - Study Notes', duration: 420},
    {ch: 'Our Home: Earth, a Unique Life Sustaining Planet', subjectName: SCIENCE, grade: '8', concept: 'Position, Size and the Habitable Zone', type: 'VIDEO', title: 'Our Home: Earth, a Unique Life Sustaining Planet - Video Lesson', duration: 1910},
    {ch: 'Our Home: Earth, a Unique Life Sustaining Planet', subjectName: SCIENCE, grade: '8', concept: 'Position, Size and the Habitable Zone', type: 'NOTES', title: 'Our Home: Earth, a Unique Life Sustaining Planet - Study Notes', duration: 420},
    {ch: 'A Square and A Cube', subjectName: MATHS, grade: '8', concept: 'Perfect Squares', type: 'VIDEO', title: 'A Square and A Cube - Video Lesson', duration: 1170},
    {ch: 'A Square and A Cube', subjectName: MATHS, grade: '8', concept: 'Perfect Squares', type: 'NOTES', title: 'A Square and A Cube - Study Notes', duration: 420},
    {ch: 'Power Play', subjectName: MATHS, grade: '8', concept: 'Powers and Exponential Form', type: 'VIDEO', title: 'Power Play - Video Lesson', duration: 1136},
    {ch: 'Power Play', subjectName: MATHS, grade: '8', concept: 'Powers and Exponential Form', type: 'NOTES', title: 'Power Play - Study Notes', duration: 420},
    {ch: 'A Story of Numbers', subjectName: MATHS, grade: '8', concept: 'Tally Marks and Counting in Groups', type: 'VIDEO', title: 'A Story of Numbers - Video Lesson', duration: 2690},
    {ch: 'A Story of Numbers', subjectName: MATHS, grade: '8', concept: 'Tally Marks and Counting in Groups', type: 'NOTES', title: 'A Story of Numbers - Study Notes', duration: 420},
    {ch: 'Quadrilaterals', subjectName: MATHS, grade: '8', concept: 'Properties of a Rectangle', type: 'VIDEO', title: 'Quadrilaterals - Video Lesson', duration: 741},
    {ch: 'Quadrilaterals', subjectName: MATHS, grade: '8', concept: 'Properties of a Rectangle', type: 'NOTES', title: 'Quadrilaterals - Study Notes', duration: 420},
    {ch: 'Number Play', subjectName: MATHS, grade: '8', concept: 'Factors and Multiples', type: 'VIDEO', title: 'Number Play - Video Lesson', duration: 6292},
    {ch: 'Number Play', subjectName: MATHS, grade: '8', concept: 'Factors and Multiples', type: 'NOTES', title: 'Number Play - Study Notes', duration: 420},
    {ch: 'We Distribute, Yet Things Multiply', subjectName: MATHS, grade: '8', concept: 'Distributive Property of Multiplication', type: 'VIDEO', title: 'We Distribute, Yet Things Multiply - Video Lesson', duration: 1064},
    {ch: 'We Distribute, Yet Things Multiply', subjectName: MATHS, grade: '8', concept: 'Distributive Property of Multiplication', type: 'NOTES', title: 'We Distribute, Yet Things Multiply - Study Notes', duration: 420},
    {ch: 'Proportional Reasoning-1', subjectName: MATHS, grade: '8', concept: 'Proportional Change', type: 'VIDEO', title: 'Proportional Reasoning-1 - Video Lesson', duration: 916},
    {ch: 'Proportional Reasoning-1', subjectName: MATHS, grade: '8', concept: 'Proportional Change', type: 'NOTES', title: 'Proportional Reasoning-1 - Study Notes', duration: 420},
    {ch: 'Fractions in Disguise', subjectName: MATHS, grade: '8', concept: 'Expressing Fractions as Percentages', type: 'VIDEO', title: 'Fractions in Disguise - Video Lesson', duration: 1853},
    {ch: 'Fractions in Disguise', subjectName: MATHS, grade: '8', concept: 'Expressing Fractions as Percentages', type: 'NOTES', title: 'Fractions in Disguise - Study Notes', duration: 420},
    {ch: 'The Baudhayana-Pythagoras Theorem', subjectName: MATHS, grade: '8', concept: 'Doubling a Square', type: 'VIDEO', title: 'The Baudhayana-Pythagoras Theorem - Video Lesson', duration: 489},
    {ch: 'The Baudhayana-Pythagoras Theorem', subjectName: MATHS, grade: '8', concept: 'Doubling a Square', type: 'NOTES', title: 'The Baudhayana-Pythagoras Theorem - Study Notes', duration: 420},
    {ch: 'Proportional Reasoning-2', subjectName: MATHS, grade: '8', concept: 'Representative Fraction and Ratios in Maps', type: 'VIDEO', title: 'Proportional Reasoning-2 - Video Lesson', duration: 388},
    {ch: 'Proportional Reasoning-2', subjectName: MATHS, grade: '8', concept: 'Representative Fraction and Ratios in Maps', type: 'NOTES', title: 'Proportional Reasoning-2 - Study Notes', duration: 420},
    {ch: 'Exploring Some Geometric Themes', subjectName: MATHS, grade: '8', concept: 'Sierpinski Carpet and Sierpinski Gasket', type: 'VIDEO', title: 'Exploring Some Geometric Themes - Video Lesson', duration: 981},
    {ch: 'Exploring Some Geometric Themes', subjectName: MATHS, grade: '8', concept: 'Sierpinski Carpet and Sierpinski Gasket', type: 'NOTES', title: 'Exploring Some Geometric Themes - Study Notes', duration: 420},
    {ch: 'Tales by Dots and Lines', subjectName: MATHS, grade: '8', concept: 'Mean as the Balance Point', type: 'VIDEO', title: 'Tales by Dots and Lines - Video Lesson', duration: 997},
    {ch: 'Tales by Dots and Lines', subjectName: MATHS, grade: '8', concept: 'Mean as the Balance Point', type: 'NOTES', title: 'Tales by Dots and Lines - Study Notes', duration: 420},
    {ch: 'Algebra Play', subjectName: MATHS, grade: '8', concept: '‘Think of a Number’ Tricks', type: 'VIDEO', title: 'Algebra Play - Video Lesson', duration: 340},
    {ch: 'Algebra Play', subjectName: MATHS, grade: '8', concept: '‘Think of a Number’ Tricks', type: 'NOTES', title: 'Algebra Play - Study Notes', duration: 420},
    {ch: 'Area', subjectName: MATHS, grade: '8', concept: 'Area of a Rectangle and a Square', type: 'VIDEO', title: 'Area - Video Lesson', duration: 3756},
    {ch: 'Area', subjectName: MATHS, grade: '8', concept: 'Area of a Rectangle and a Square', type: 'NOTES', title: 'Area - Study Notes', duration: 420},
    {ch: 'Wit and Wisdom', subjectName: ENGLISH, grade: '8', concept: 'The Wit that Won Hearts', type: 'VIDEO', title: 'Wit and Wisdom - Video Lesson', duration: 523},
    {ch: 'Wit and Wisdom', subjectName: ENGLISH, grade: '8', concept: 'The Wit that Won Hearts', type: 'NOTES', title: 'Wit and Wisdom - Study Notes', duration: 420},
    {ch: 'Values and Dispositions', subjectName: ENGLISH, grade: '8', concept: 'Major Somnath Sharma and the Battle of Badgam', type: 'VIDEO', title: 'Values and Dispositions - Video Lesson', duration: 381},
    {ch: 'Values and Dispositions', subjectName: ENGLISH, grade: '8', concept: 'Major Somnath Sharma and the Battle of Badgam', type: 'NOTES', title: 'Values and Dispositions - Study Notes', duration: 420},
    {ch: 'Mystery and Magic', subjectName: ENGLISH, grade: '8', concept: '‘The Case of the Fifth Word’ by Donald J. Sobol', type: 'VIDEO', title: 'Mystery and Magic - Video Lesson', duration: 294},
    {ch: 'Mystery and Magic', subjectName: ENGLISH, grade: '8', concept: '‘The Case of the Fifth Word’ by Donald J. Sobol', type: 'NOTES', title: 'Mystery and Magic - Study Notes', duration: 420},
    {ch: 'Environment', subjectName: ENGLISH, grade: '8', concept: '‘The Cherry Tree’ by Ruskin Bond', type: 'VIDEO', title: 'Environment - Video Lesson', duration: 4035},
    {ch: 'Environment', subjectName: ENGLISH, grade: '8', concept: '‘The Cherry Tree’ by Ruskin Bond', type: 'NOTES', title: 'Environment - Study Notes', duration: 420},
    {ch: 'Science and Curiosity', subjectName: ENGLISH, grade: '8', concept: '‘Feathered Friend’ by Arthur C. Clarke', type: 'VIDEO', title: 'Science and Curiosity - Video Lesson', duration: 374},
    {ch: 'Science and Curiosity', subjectName: ENGLISH, grade: '8', concept: '‘Feathered Friend’ by Arthur C. Clarke', type: 'NOTES', title: 'Science and Curiosity - Study Notes', duration: 420},
    {ch: 'How Forces Affect Motion', subjectName: SCIENCE, grade: '9', concept: 'Newton\'s Second and Third Laws', type: 'VIDEO', title: 'How Forces Affect Motion - Video Lesson', duration: 2022},
    {ch: 'How Forces Affect Motion', subjectName: SCIENCE, grade: '9', concept: 'Newton\'s Second and Third Laws', type: 'NOTES', title: 'How Forces Affect Motion - Study Notes', duration: 420},
    {ch: 'Work, Energy, and Simple Machines', subjectName: SCIENCE, grade: '9', concept: 'Kinetic and Potential Energy', type: 'VIDEO', title: 'Work, Energy, and Simple Machines - Video Lesson', duration: 440},
    {ch: 'Work, Energy, and Simple Machines', subjectName: SCIENCE, grade: '9', concept: 'Kinetic and Potential Energy', type: 'NOTES', title: 'Work, Energy, and Simple Machines - Study Notes', duration: 420},
    {ch: 'Journey Inside the Atom', subjectName: SCIENCE, grade: '9', concept: 'Bohr\'s Model and Energy Levels', type: 'VIDEO', title: 'Journey Inside the Atom - Video Lesson', duration: 1344},
    {ch: 'Journey Inside the Atom', subjectName: SCIENCE, grade: '9', concept: 'Bohr\'s Model and Energy Levels', type: 'NOTES', title: 'Journey Inside the Atom - Study Notes', duration: 420},
    {ch: 'Atomic Foundations of Matter', subjectName: SCIENCE, grade: '9', concept: 'Covalent and Ionic Bonds', type: 'VIDEO', title: 'Atomic Foundations of Matter - Video Lesson', duration: 1739},
    {ch: 'Atomic Foundations of Matter', subjectName: SCIENCE, grade: '9', concept: 'Covalent and Ionic Bonds', type: 'NOTES', title: 'Atomic Foundations of Matter - Study Notes', duration: 420},
    {ch: 'Sound Waves: Characteristics and Applications', subjectName: SCIENCE, grade: '9', concept: 'Wavelength, Frequency and Amplitude', type: 'VIDEO', title: 'Sound Waves: Characteristics and Applications - Video Lesson', duration: 1617},
    {ch: 'Sound Waves: Characteristics and Applications', subjectName: SCIENCE, grade: '9', concept: 'Wavelength, Frequency and Amplitude', type: 'NOTES', title: 'Sound Waves: Characteristics and Applications - Study Notes', duration: 420},
    {ch: 'Reproduction: How Life Continues', subjectName: SCIENCE, grade: '9', concept: 'Meiosis, Pollination and Fertilisation', type: 'VIDEO', title: 'Reproduction: How Life Continues - Video Lesson', duration: 1835},
    {ch: 'Reproduction: How Life Continues', subjectName: SCIENCE, grade: '9', concept: 'Meiosis, Pollination and Fertilisation', type: 'NOTES', title: 'Reproduction: How Life Continues - Study Notes', duration: 420},
    {ch: 'Patterns in Life: Diversity and Classification', subjectName: SCIENCE, grade: '9', concept: 'Five Kingdom Classification', type: 'VIDEO', title: 'Patterns in Life: Diversity and Classification - Video Lesson', duration: 2072},
    {ch: 'Patterns in Life: Diversity and Classification', subjectName: SCIENCE, grade: '9', concept: 'Five Kingdom Classification', type: 'NOTES', title: 'Patterns in Life: Diversity and Classification - Study Notes', duration: 420},
    {ch: 'Earth as a System: Energy, Matter, and Life', subjectName: SCIENCE, grade: '9', concept: 'Water, Carbon, Nitrogen and Oxygen Cycles', type: 'VIDEO', title: 'Earth as a System: Energy, Matter, and Life - Video Lesson', duration: 3791},
    {ch: 'Earth as a System: Energy, Matter, and Life', subjectName: SCIENCE, grade: '9', concept: 'Water, Carbon, Nitrogen and Oxygen Cycles', type: 'NOTES', title: 'Earth as a System: Energy, Matter, and Life - Study Notes', duration: 420},
    {ch: 'I\'m Up and Down, and Round and Round', subjectName: MATHS, grade: '9', concept: 'Angles Subtended by an Arc and Concyclicity', type: 'VIDEO', title: 'I\'m Up and Down, and Round and Round - Video Lesson', duration: 1818},
    {ch: 'I\'m Up and Down, and Round and Round', subjectName: MATHS, grade: '9', concept: 'Angles Subtended by an Arc and Concyclicity', type: 'NOTES', title: 'I\'m Up and Down, and Round and Round - Study Notes', duration: 0},
    {ch: 'Measuring Space: Perimeter and Area', subjectName: MATHS, grade: '9', concept: 'Area of a Circle and Its Sector', type: 'VIDEO', title: 'Measuring Space: Perimeter and Area - Video Lesson', duration: 634},
    {ch: 'Measuring Space: Perimeter and Area', subjectName: MATHS, grade: '9', concept: 'Area of a Circle and Its Sector', type: 'NOTES', title: 'Measuring Space: Perimeter and Area - Study Notes', duration: 420},
    {ch: 'The Mathematics of Maybe: Introduction to Probability', subjectName: MATHS, grade: '9', concept: 'Experimental and Theoretical Probability', type: 'VIDEO', title: 'The Mathematics of Maybe: Introduction to Probability - Video Lesson', duration: 7984},
    {ch: 'The Mathematics of Maybe: Introduction to Probability', subjectName: MATHS, grade: '9', concept: 'Experimental and Theoretical Probability', type: 'NOTES', title: 'The Mathematics of Maybe: Introduction to Probability - Study Notes', duration: 420},
    {ch: 'Predicting What Comes Next: Exploring Sequences and Progressions', subjectName: MATHS, grade: '9', concept: 'Arithmetic Progressions', type: 'VIDEO', title: 'Predicting What Comes Next: Exploring Sequences and Progressions - Video Lesson', duration: 930},
    {ch: 'Predicting What Comes Next: Exploring Sequences and Progressions', subjectName: MATHS, grade: '9', concept: 'Arithmetic Progressions', type: 'NOTES', title: 'Predicting What Comes Next: Exploring Sequences and Progressions - Study Notes', duration: 420},
    {ch: 'How I Taught My Grandmother to Read', subjectName: ENGLISH, grade: '9', concept: 'Literacy and Self-Worth', type: 'VIDEO', title: 'How I Taught My Grandmother to Read - Video Lesson', duration: 1440},
    {ch: 'How I Taught My Grandmother to Read', subjectName: ENGLISH, grade: '9', concept: 'Literacy and Self-Worth', type: 'NOTES', title: 'How I Taught My Grandmother to Read - Study Notes', duration: 420},
    {ch: 'The Pot Maker', subjectName: ENGLISH, grade: '9', concept: 'Determination and Skill', type: 'VIDEO', title: 'The Pot Maker - Video Lesson', duration: 713},
    {ch: 'The Pot Maker', subjectName: ENGLISH, grade: '9', concept: 'Determination and Skill', type: 'NOTES', title: 'The Pot Maker - Study Notes', duration: 420},
    {ch: 'Winds of Change', subjectName: ENGLISH, grade: '9', concept: 'Indigenous Craft of the Pankha', type: 'VIDEO', title: 'Winds of Change - Video Lesson', duration: 2031},
    {ch: 'Winds of Change', subjectName: ENGLISH, grade: '9', concept: 'Indigenous Craft of the Pankha', type: 'NOTES', title: 'Winds of Change - Study Notes', duration: 420},
    {ch: 'Vitamin-M', subjectName: ENGLISH, grade: '9', concept: 'Caring for the Elderly', type: 'VIDEO', title: 'Vitamin-M - Video Lesson', duration: 2016},
    {ch: 'Vitamin-M', subjectName: ENGLISH, grade: '9', concept: 'Caring for the Elderly', type: 'NOTES', title: 'Vitamin-M - Study Notes', duration: 420},
    {ch: 'The World of Limitless Possibilities', subjectName: ENGLISH, grade: '9', concept: 'Paralympics and Resilience', type: 'VIDEO', title: 'The World of Limitless Possibilities - Video Lesson', duration: 1227},
    {ch: 'The World of Limitless Possibilities', subjectName: ENGLISH, grade: '9', concept: 'Paralympics and Resilience', type: 'NOTES', title: 'The World of Limitless Possibilities - Study Notes', duration: 420},
    {ch: 'Twin Melodies', subjectName: ENGLISH, grade: '9', concept: 'Classical and Contemporary Music', type: 'VIDEO', title: 'Twin Melodies - Video Lesson', duration: 513},
    {ch: 'Twin Melodies', subjectName: ENGLISH, grade: '9', concept: 'Classical and Contemporary Music', type: 'NOTES', title: 'Twin Melodies - Study Notes', duration: 420},
    {ch: 'Carrier of Words', subjectName: ENGLISH, grade: '9', concept: 'Gramin Dak Sewak', type: 'VIDEO', title: 'Carrier of Words - Video Lesson', duration: 798},
    {ch: 'Carrier of Words', subjectName: ENGLISH, grade: '9', concept: 'Gramin Dak Sewak', type: 'NOTES', title: 'Carrier of Words - Study Notes', duration: 420},
    {ch: 'Follow That Dream', subjectName: ENGLISH, grade: '9', concept: 'Dreams and Self-Belief', type: 'VIDEO', title: 'Follow That Dream - Video Lesson', duration: 2010},
    {ch: 'Follow That Dream', subjectName: ENGLISH, grade: '9', concept: 'Dreams and Self-Belief', type: 'NOTES', title: 'Follow That Dream - Study Notes', duration: 420}] as const;

  const demoUser = await prisma.user.findUnique({ where: { email: 'teacher@sanroai.com' } });

  const videoUrls: Record<string, string> = {
    'Types of Chemical Reactions': 'https://www.youtube.com/embed/6esN2vQCwrY',
    'Balancing Chemical Equations': 'https://www.youtube.com/embed/fBFETm36Tc4',
    'Properties of Acids and Bases': 'https://www.youtube.com/embed/jGOKug-dA0g',
    'pH Scale Explained': 'https://www.youtube.com/embed/jGOKug-dA0g',
    'Physical Properties of Metals': 'https://www.youtube.com/embed/fG3cGzNjLtE',
    'Reactivity Series of Metals': 'https://www.youtube.com/embed/NANATmk_VdM',
    'Covalent Bonding in Carbon': 'https://www.youtube.com/embed/nTC3I2FEhng',
    'Functional Groups Explained': 'https://www.youtube.com/embed/ao45PaqNU7k',
    'Nutrition in Living Organisms': 'https://www.youtube.com/embed/SBZfM0GuNmw',
    'Transport in Humans': 'https://www.youtube.com/embed/hyAjjrEa10Q',
    'Reflection of Light': 'https://www.youtube.com/embed/BjP3bftplSo',
    'Refraction and Snell\'s Law': 'https://www.youtube.com/embed/-x8q_BvM-3Q',
    'Ohm\'s Law Explained': 'https://www.youtube.com/embed/4RACJDRBW6o',
    'Electric Power and Energy': 'https://www.youtube.com/embed/GioeY8h3RXs',
    'Euclid\'s Division Lemma': 'https://www.youtube.com/embed/ZCcVfJ8f32E',
    'Irrational Numbers and Decimals': 'https://www.youtube.com/embed/fHxOEgrdnyM',
    'Zeroes and Graphs of Polynomials': 'https://www.youtube.com/embed/rD7ThbyTh-k',
    'Division Algorithm for Polynomials': 'https://www.youtube.com/embed/FsotIB0Usvw',
    'Solving Quadratics by Factoring': 'https://www.youtube.com/embed/8vstZDprTgo',
    'Quadratic Formula Explained': 'https://www.youtube.com/embed/8vstZDprTgo',
    'Arithmetic Progression - nth Term': 'https://www.youtube.com/embed/4488Wh-69Pg',
    'Sum of n Terms of AP': 'https://www.youtube.com/embed/24aTejFcRPQ',
    'Trigonometric Ratios Explained': 'https://www.youtube.com/embed/nf69QEuQ1IM',
    'Trigonometric Identities': 'https://www.youtube.com/embed/rrtSJ7MJEKA',
    'Mean, Median, Mode for Grouped Data': 'https://www.youtube.com/embed/csU9suFcfwM',
    'Classical Probability': 'https://www.youtube.com/embed/jBy-_qHeMa0',
    'Similarity of Triangles': 'https://www.youtube.com/embed/SkmrpY0bXPI',
    'Distance and Section Formula': 'https://www.youtube.com/embed/QOhXsR6vJ5w',
    'Tangents to a Circle': 'https://www.youtube.com/embed/K5vpPprere4',
    'Surface Areas and Volumes': 'https://www.youtube.com/embed/P4bnYvV15Rk',
    'Plants and Animals - Video Lesson': 'https://www.youtube.com/embed/1K8NkVfSCgE',
    'Our Body and Food - Video Lesson': 'https://www.youtube.com/embed/LSOvevsM3aY',
    'Numbers up to 100 - Video Lesson': 'https://www.youtube.com/embed/7rZpadxlKxs',
    'Shapes and Patterns - Video Lesson': 'https://www.youtube.com/embed/jlzX8jt0Now',
    'Plants Around Us - Video Lesson': 'https://www.youtube.com/embed/DHGQ3elHDIE',
    'Animals and Their Young - Video Lesson': 'https://www.youtube.com/embed/-3peTUkaem8',
    'Numbers up to 1000 - Video Lesson': 'https://www.youtube.com/embed/2KsY7-qLmd0',
    'Introduction to Multiplication - Video Lesson': 'https://www.youtube.com/embed/ZJSDq2yXRq8',
    'The World of Plants - Video Lesson': 'https://www.youtube.com/embed/8z9mQycA4Og',
    'The Human Body - Video Lesson': 'https://www.youtube.com/embed/AHQGNb0zBgg',
    'Properties of Materials - Video Lesson': 'https://www.youtube.com/embed/1UUROogwl24',
    'Numbers up to 10000 - Video Lesson': 'https://www.youtube.com/embed/QS32l5WhSuY',
    'Multiplication and Division - Video Lesson': 'https://www.youtube.com/embed/tER-YslAY-8',
    'Food and Nutrition - Video Lesson': 'https://www.youtube.com/embed/TkzMN0BK0Bo',
    'The Living World - Video Lesson': 'https://www.youtube.com/embed/6GtnSNSP8oE',
    'Large Numbers - Video Lesson': 'https://www.youtube.com/embed/Usu3Z3CPa48',
    'Operations on Numbers - Video Lesson': 'https://www.youtube.com/embed/OaTIgGp5zmo',
    'The World of Living Things - Video Lesson': 'https://www.youtube.com/embed/jQI5EBy0Syg',
    'Materials: Pure and Mixed - Video Lesson': 'https://www.youtube.com/embed/3enxXZH6Yto',
    'Forces and Energy - Video Lesson': 'https://www.youtube.com/embed/cZtZdYtIfIU',
    'Numbers and Operations - Video Lesson': 'https://www.youtube.com/embed/53Noy4cRLAo',
    'Fractions and Decimals - Video Lesson': 'https://www.youtube.com/embed/DKanWcCq1B4',
    'Geometry and Mensuration - Video Lesson': 'https://www.youtube.com/embed/mt0bboAae5A',
    'The World of the Living - Video Lesson': 'https://www.youtube.com/embed/kRQ0DYmlRtg',
    'Body Movements - Video Lesson': 'https://www.youtube.com/embed/I-Hlhuhb_GA',
    'Basic Geometrical Ideas - Video Lesson': 'https://www.youtube.com/embed/k6f89zlWKJs',
    'Integers - Video Lesson': 'https://www.youtube.com/embed/LYgCL1ALjD8',
    'Algebra - Video Lesson': 'https://www.youtube.com/embed/UDqELbiTIn4',
    'Nutrition in Living Organisms - Video Lesson': 'https://www.youtube.com/embed/X0a1Q20N_9k',
    'Heat and Temperature - Video Lesson': 'https://www.youtube.com/embed/Me60Ti0E_rY',
    'Electric Current and Circuits - Video Lesson': 'https://www.youtube.com/embed/7-leJOG2nuU',
    'Integers and Fractions - Video Lesson': 'https://www.youtube.com/embed/xknRPaetoFk',
    'Linear Equations - Video Lesson': 'https://www.youtube.com/embed/tHm3X_Ta_iE',
    'Geometry - Video Lesson': 'https://www.youtube.com/embed/r-zV9_FfLjI',
    'Control and Coordination - Video Lesson': 'https://www.youtube.com/embed/qB2kXsF68uw',
    'How do Organisms Reproduce? - Video Lesson': 'https://www.youtube.com/embed/D3FN3jLlT54',
    'Heredity and Evolution - Video Lesson': 'https://www.youtube.com/embed/m1vfHJaaf4E',
    'Human Eye and Colourful World - Video Lesson': 'https://www.youtube.com/embed/5Z3xr2A6wEY',
    'Magnetic Effects of Electric Current - Video Lesson': 'https://www.youtube.com/embed/uuHKwoPQE0g',
    'Our Environment - Video Lesson': 'https://www.youtube.com/embed/1z6hrVdDDb4',
    'Pair of Linear Equations in Two Variables - Video Lesson': 'https://www.youtube.com/embed/S6hCiHmky_U',
    'Applications of Trigonometry - Video Lesson': 'https://www.youtube.com/embed/o589uRU9txM',
    'Constructions - Video Lesson': 'https://www.youtube.com/embed/mO8JQAAoFpw',
    'Areas Related to Circles - Video Lesson': 'https://www.youtube.com/embed/usf6lf_3DnU',
    'A Letter to God - Video Lesson': 'https://www.youtube.com/embed/TgqwVI0AE_o',
    'Nelson Mandela: Long Walk to Freedom - Video Lesson': 'https://www.youtube.com/embed/UXpLYES-n3o',
    'Two Stories about Flying - Video Lesson': 'https://www.youtube.com/embed/DCqd00umZ0g',
    'From the Diary of Anne Frank - Video Lesson': 'https://www.youtube.com/embed/fc7QwZ_JMyI',
    'Glimpses of India - Video Lesson': 'https://www.youtube.com/embed/_EIF5nPScc0',
    'Mijbil the Otter - Video Lesson': 'https://www.youtube.com/embed/dhJYOmc3GqM',
    'Madam Rides the Bus - Video Lesson': 'https://www.youtube.com/embed/ilqfuPYXydg',
    'The Sermon at Benares - Video Lesson': 'https://www.youtube.com/embed/fuTPzeFy7L0',
    'The Proposal - Video Lesson': 'https://www.youtube.com/embed/owj-G3ACjWw',

  'Exploring the Investigative World of Science - Video Lesson': 'https://www.youtube.com/embed/8ddIyWsNY4c',
  'The Invisible Living World: Beyond Our Naked Eye - Video Lesson': 'https://www.youtube.com/embed/-k44syG2FX0',
  'Health: The Ultimate Treasure - Video Lesson': 'https://www.youtube.com/embed/LN6hSuhWWbY',
  'Electricity: Magnetic and Heating Effects - Video Lesson': 'https://www.youtube.com/embed/CFvYVCEKyuo',
  'Exploring Forces - Video Lesson': 'https://www.youtube.com/embed/WAQhstCxKkg',
  'Pressure, Winds, Storms, and Cyclones - Video Lesson': 'https://www.youtube.com/embed/mY5kf-9ui04',
  'Particulate Nature of Matter - Video Lesson': 'https://www.youtube.com/embed/betA2jxZdOk',
  'Nature of Matter: Elements, Compounds, and Mixtures - Video Lesson': 'https://www.youtube.com/embed/KNJEfEogZwA',
  'The Amazing World of Solutes, Solvents, and Solutions - Video Lesson': 'https://www.youtube.com/embed/uyrVoCX1aLA',
  'Light: Mirrors and Lenses - Video Lesson': 'https://www.youtube.com/embed/oDNqfxRYQY0',
  'Keeping Time with the Skies - Video Lesson': 'https://www.youtube.com/embed/w8jkxGnbq5Y',
  'How Nature Works in Harmony - Video Lesson': 'https://www.youtube.com/embed/8AeuqbcjuHg',
  'Our Home: Earth, a Unique Life Sustaining Planet - Video Lesson': 'https://www.youtube.com/embed/NXgkMdHpGy8',
  'A Square and A Cube - Video Lesson': 'https://www.youtube.com/embed/q_MlQ-vhADQ',
  'Power Play - Video Lesson': 'https://www.youtube.com/embed/xMmQ9nxpIAY',
  'A Story of Numbers - Video Lesson': 'https://www.youtube.com/embed/eNibgsD0NrI',
  'Quadrilaterals - Video Lesson': 'https://www.youtube.com/embed/daaWQXn-Me4',
  'Number Play - Video Lesson': 'https://www.youtube.com/embed/eDc9_h5-rSs',
  'We Distribute, Yet Things Multiply - Video Lesson': 'https://www.youtube.com/embed/q9kIBrWqbbI',
  'Proportional Reasoning-1 - Video Lesson': 'https://www.youtube.com/embed/5Ot8AT2ZcZg',
  'Fractions in Disguise - Video Lesson': 'https://www.youtube.com/embed/paIbLvOmsv4',
  'The Baudhayana-Pythagoras Theorem - Video Lesson': 'https://www.youtube.com/embed/fnhmnxm-LXs',
  'Proportional Reasoning-2 - Video Lesson': 'https://www.youtube.com/embed/reReB0WEGBM',
  'Exploring Some Geometric Themes - Video Lesson': 'https://www.youtube.com/embed/d5ktiurjEYA',
  'Tales by Dots and Lines - Video Lesson': 'https://www.youtube.com/embed/3jY35d4OjTI',
  'Algebra Play - Video Lesson': 'https://www.youtube.com/embed/7wvWdom4Fzc',
  'Area - Video Lesson': 'https://www.youtube.com/embed/zRXb1S-xgDY',
  'Wit and Wisdom - Video Lesson': 'https://www.youtube.com/embed/F5uLT0JCCyQ',
  'Values and Dispositions - Video Lesson': 'https://www.youtube.com/embed/dWFWmjsik34',
  'Mystery and Magic - Video Lesson': 'https://www.youtube.com/embed/oLGpI04pDyM',
  'Environment - Video Lesson': 'https://www.youtube.com/embed/00yWe7jWKCs',
  'Science and Curiosity - Video Lesson': 'https://www.youtube.com/embed/Zzc73yOUP2w',

  'How Forces Affect Motion - Video Lesson': 'https://www.youtube.com/embed/eULlSMBIikc',
  'Work, Energy, and Simple Machines - Video Lesson': 'https://www.youtube.com/embed/mSnrmDgJdGE',
  'Journey Inside the Atom - Video Lesson': 'https://www.youtube.com/embed/7E2TpLdZ9J4',
  'Atomic Foundations of Matter - Video Lesson': 'https://www.youtube.com/embed/sqiz-TJdJN0',
  'Sound Waves: Characteristics and Applications - Video Lesson': 'https://www.youtube.com/embed/O3UiGXhojUs',
  'Reproduction: How Life Continues - Video Lesson': 'https://www.youtube.com/embed/qh4yc5gsAeY',
  'Patterns in Life: Diversity and Classification - Video Lesson': 'https://www.youtube.com/embed/ThfumBNNbb0',
  'Earth as a System: Energy, Matter, and Life - Video Lesson': 'https://www.youtube.com/embed/dKFqBtMLu6U',
  'I\'m Up and Down, and Round and Round - Video Lesson': 'https://www.youtube.com/embed/0S7k_2pgrL4',
  'Measuring Space: Perimeter and Area - Video Lesson': 'https://www.youtube.com/embed/O5Ptphsgu6M',
  'The Mathematics of Maybe: Introduction to Probability - Video Lesson': 'https://www.youtube.com/embed/2kI30-X8PeA',
  'Predicting What Comes Next: Exploring Sequences and Progressions - Video Lesson': 'https://www.youtube.com/embed/l8YMn74Ct9w',
  'How I Taught My Grandmother to Read - Video Lesson': 'https://www.youtube.com/embed/-h3O_pdqwmY',
  'The Pot Maker - Video Lesson': 'https://www.youtube.com/embed/xKRQJ4hwLD0',
  'Winds of Change - Video Lesson': 'https://www.youtube.com/embed/0GCNZvjVlug',
  'Vitamin-M - Video Lesson': 'https://www.youtube.com/embed/BRR6qvASoME',
  'The World of Limitless Possibilities - Video Lesson': 'https://www.youtube.com/embed/yerUhE7FO98',
  'Twin Melodies - Video Lesson': 'https://www.youtube.com/embed/g5ZRKzfXmEM',
  'Carrier of Words - Video Lesson': 'https://www.youtube.com/embed/bJpBBXczU-E',
  'Follow That Dream - Video Lesson': 'https://www.youtube.com/embed/cBbR1Re7lJ4',
  'Exploration: Entering the World of Secondary Science - Video Lesson': 'https://www.youtube.com/embed/9vfOQhiIOKg',
  'Cell: The Building Block of Life - Video Lesson': 'https://www.youtube.com/embed/elMwYvvAZiQ',
  'Tissues in Action - Video Lesson': 'https://www.youtube.com/embed/Qk-GmAbg0bo',
  'Describing Motion Around Us - Video Lesson': 'https://www.youtube.com/embed/udr3zQg1sQ4',
  'Exploring Mixtures and their Separation - Video Lesson': 'https://www.youtube.com/embed/KxtTBvdameQ',
  'Orienting Yourself: The Use of Coordinates - Video Lesson': 'https://www.youtube.com/embed/y4ABZWLL-8k',
  'Introduction to Linear Polynomials - Video Lesson': 'https://www.youtube.com/embed/pB8D6QudDIw',
  'The World of Numbers - Video Lesson': 'https://www.youtube.com/embed/sHs1Q5xquFw',
  'Exploring Algebraic Identities - Video Lesson': 'https://www.youtube.com/embed/lTXvR0l3WCI',
};
// Chapter markers of the lesson videos (a long lesson split by time).
const videoSegments: Record<string, Array<{ title: string; startSeconds: number }>> = {
  'Reactivity Series of Metals': [{ title: 'Class 10 Chemistry', startSeconds: 0 }, { title: 'Metals and Non Metals-Reactivity Series', startSeconds: 20 }, { title: 'Displacement', startSeconds: 147 }],
  'Covalent Bonding in Carbon': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Bonding in carbon - the covalent bond', startSeconds: 394 }, { title: 'Properties of some carbon compounds', startSeconds: 447 }, { title: 'Formation of molecules by sharing of electrons', startSeconds: 2347 }, { title: 'Difference between ionic compound and covalent compound', startSeconds: 3699 }, { title: 'Versatile nature of carbon', startSeconds: 4420 }, { title: 'Saturated and unsaturated carbon compounds', startSeconds: 5266 }, { title: 'Chains, branches and rings', startSeconds: 6530 }, { title: 'Will you be my friend (Functional groups)', startSeconds: 7075 }, { title: 'Homologous series', startSeconds: 7428 }, { title: 'Nomenclature of carbon compounds (IUPAC nomenclature)', startSeconds: 8141 }, { title: 'Chemical properties of carbon compounds', startSeconds: 10496 }, { title: 'Some important carbon compounds - ethanol and ethanoic acid', startSeconds: 12300 }, { title: 'Soaps and detergents', startSeconds: 14742 }],
  'Reflection of Light': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Reflection of Light by Plane Mirror', startSeconds: 98 }, { title: 'Laws of Reflection', startSeconds: 239 }, { title: 'Types of Reflection', startSeconds: 412 }, { title: 'Reflection of Spherical Mirrors', startSeconds: 534 }, { title: 'Spherical Mirrors Image Formation', startSeconds: 1206 }, { title: 'Concave Mirror', startSeconds: 1315 }, { title: 'Convex Mirror', startSeconds: 1916 }, { title: 'Refraction of Light', startSeconds: 2290 }],
  'Euclid\'s Division Lemma': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Factors and Multiples', startSeconds: 54 }, { title: 'HCF & LCM', startSeconds: 129 }, { title: 'Prime Factorisation Method', startSeconds: 236 }, { title: 'Relation between HCF & LCM', startSeconds: 382 }, { title: 'Prime vs Co-Prime', startSeconds: 429 }, { title: 'Rational & Irrational', startSeconds: 528 }, { title: 'Decimal Expansion', startSeconds: 680 }, { title: 'Fundamental Theorem of Arithmetic', startSeconds: 803 }, { title: 'Fun Funde', startSeconds: 904 }, { title: 'Types of Questions', startSeconds: 1154 }, { title: 'Thank you', startSeconds: 1210 }],
  'Solving Quadratics by Factoring': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Quadratic Equations', startSeconds: 35 }, { title: 'Points to Remember', startSeconds: 126 }, { title: 'Middle Term Splitting Method for finding Roots', startSeconds: 189 }, { title: 'Discriminant', startSeconds: 519 }, { title: 'Word Problems', startSeconds: 685 }, { title: 'Thank you', startSeconds: 1050 }],
  'Quadratic Formula Explained': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Quadratic Equations', startSeconds: 35 }, { title: 'Points to Remember', startSeconds: 126 }, { title: 'Middle Term Splitting Method for finding Roots', startSeconds: 189 }, { title: 'Discriminant', startSeconds: 519 }, { title: 'Word Problems', startSeconds: 685 }, { title: 'Thank you', startSeconds: 1050 }],
  'Sum of n Terms of AP': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Class 10th Syllabus', startSeconds: 74 }, { title: 'Pie Chart Fabrication', startSeconds: 331 }, { title: 'Must Do Questions', startSeconds: 533 }, { title: 'Resources Video', startSeconds: 563 }, { title: 'Thank You', startSeconds: 700 }],
  'Trigonometric Identities': [{ title: 'Introduction to Trigonometry - Trigonometric Identities', startSeconds: 0 }, { title: 'Trigonometric Identities', startSeconds: 65 }, { title: 'Website Overview', startSeconds: 1476 }],
  'Distance and Section Formula': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Distance Between Two Points', startSeconds: 71 }, { title: 'Examples of Co-ordinate Geometry', startSeconds: 2217 }],
  'Tangents to a Circle': [{ title: 'Introduction: Circles', startSeconds: 0 }, { title: 'Tangent to a Circle', startSeconds: 9 }, { title: 'Website Overview', startSeconds: 893 }],
  'Surface Areas and Volumes': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Key Words', startSeconds: 392 }, { title: 'Some Useful Formulae', startSeconds: 872 }, { title: 'Total Surface Area', startSeconds: 2558 }, { title: 'Important Question 1 & 2', startSeconds: 3626 }, { title: 'Important Question 3 & 4', startSeconds: 4210 }, { title: 'Important Question 5 & 6', startSeconds: 5060 }, { title: 'Important Question 7', startSeconds: 6342 }, { title: 'Break', startSeconds: 7300 }, { title: 'Important Question 8 & 9', startSeconds: 8030 }, { title: 'Important Question 10 & 11', startSeconds: 9230 }, { title: 'Important Question 12 & 13', startSeconds: 10123 }, { title: 'Important Question 14 & 15', startSeconds: 10386 }, { title: 'Important Question 16 & 17', startSeconds: 11123 }, { title: 'Important Question 18 & 19', startSeconds: 11725 }, { title: 'Love Sir Entry & How CA was cracked by Student', startSeconds: 12960 }, { title: 'Thank you', startSeconds: 14040 }],
  'Plants Around Us - Video Lesson': [{ title: 'intro', startSeconds: 0 }, { title: 'Types', startSeconds: 30 }, { title: 'Summary', startSeconds: 188 }],
  'Introduction to Multiplication - Video Lesson': [{ title: 'Introduction to Equal Groups & Bicycles Example', startSeconds: 0 }, { title: 'Equal vs. Unequal Groups Explained', startSeconds: 45 }, { title: 'What is Repeated Addition', startSeconds: 90 }, { title: 'Introducing the Multiplication Sign ()', startSeconds: 140 }, { title: 'Skip Counting on a Number Line (2s,5s,10s)', startSeconds: 190 }, { title: 'Rows & Columns (Counting Eggs & Stamps)', startSeconds: 240 }, { title: 'Solving Real-Life Word Problems', startSeconds: 285 }, { title: 'Practice Activity & Wrap-up', startSeconds: 330 }],
  'The Human Body - Video Lesson': [{ title: 'Rock \'N Learn Title Screen', startSeconds: 0 }, { title: 'Introduction', startSeconds: 5 }, { title: 'Body Systems', startSeconds: 76 }, { title: 'Skeletal System', startSeconds: 95 }, { title: 'Nervous System', startSeconds: 126 }, { title: 'Muscular System', startSeconds: 167 }, { title: 'Circulatory System', startSeconds: 195 }, { title: 'Urinary System', startSeconds: 302 }, { title: 'Respiratory System', startSeconds: 354 }, { title: 'Digestive System', startSeconds: 544 }, { title: 'Alimentary Canal Song & Log Ride', startSeconds: 838 }, { title: 'The Sensory Learning Center', startSeconds: 974 }, { title: 'Sight', startSeconds: 994 }, { title: 'Taste', startSeconds: 1206 }, { title: 'Smell', startSeconds: 1243 }, { title: 'Sound', startSeconds: 1356 }, { title: 'Touch', startSeconds: 1507 }, { title: 'The Body Wheel Game', startSeconds: 1586 }, { title: 'Introduction to Practice Test Questions', startSeconds: 1892 }, { title: 'Test Question 1: Digestive System', startSeconds: 1914 }],
  'Numbers up to 10000 - Video Lesson': [{ title: 'What place values do', startSeconds: 0 }, { title: 'Digits', startSeconds: 15 }, { title: 'What place value means', startSeconds: 144 }, { title: 'Ones, tens, hundreds and thousands', startSeconds: 169 }, { title: 'Place value quiz', startSeconds: 423 }],
  'The Living World - Video Lesson': [{ title: 'WHAT IS A HABITAT', startSeconds: 2 }, { title: 'GRASSLAND HABITAT', startSeconds: 34 }, { title: 'POLAR HABITAT', startSeconds: 162 }, { title: 'MOUNTAIN HABITAT', startSeconds: 266 }, { title: 'DESERT HABITAT', startSeconds: 380 }, { title: 'FOREST HABITAT', startSeconds: 502 }, { title: 'FRESHWATER HABITAT', startSeconds: 627 }, { title: 'MARINE HABITAT', startSeconds: 772 }, { title: 'RAINFOREST HABITAT', startSeconds: 866 }],
  'Fractions and Decimals - Video Lesson': [{ title: 'Index for Chapter Fractions', startSeconds: 0 }, { title: 'What is Fraction', startSeconds: 123 }, { title: 'Types of Fractions', startSeconds: 214 }, { title: 'Proper, Improper and Mixed Fractions', startSeconds: 236 }, { title: 'Unit Fractions', startSeconds: 446 }, { title: 'Like & Unlike Fractions', startSeconds: 483 }, { title: 'Conversion of improper fraction into mixed fraction and vice versa', startSeconds: 564 }, { title: 'Equivalent fractions', startSeconds: 910 }, { title: 'How to make equivalent fractions', startSeconds: 982 }, { title: 'Simplification of fractions', startSeconds: 1190 }, { title: 'Comparing and ordering of fractions', startSeconds: 1418 }, { title: 'Addition and Subtraction of fractions', startSeconds: 1968 }, { title: 'Word problems on fractions P1', startSeconds: 2463 }, { title: 'Multiplication of fractions', startSeconds: 2955 }, { title: 'Division of fractions', startSeconds: 3278 }, { title: 'Word problems on fractions P2', startSeconds: 3486 }, { title: 'Worksheet', startSeconds: 3806 }],
  'Integers - Video Lesson': [{ title: 'Addition of integers on Number Line', startSeconds: 108 }, { title: 'Integers: Addition (Positive  Positive)', startSeconds: 323 }, { title: 'Integers: Addition (Positive  Negative)', startSeconds: 403 }, { title: 'Integers: Addition (Negative  Negative)', startSeconds: 585 }, { title: 'Additive Identity', startSeconds: 690 }, { title: 'Ex 6.2 Q2 (c), (f)', startSeconds: 875 }, { title: 'Ex 6.2 Q3 (d), Q4 (d)', startSeconds: 1052 }, { title: 'Ex 6.3 Q5 (b)', startSeconds: 1134 }, { title: 'Subtraction of Integers on Number Line', startSeconds: 1198 }, { title: 'Subtraction logic', startSeconds: 1328 }, { title: 'Integer: Subtraction', startSeconds: 1406 }, { title: 'Sum of addition and subtraction on integers', startSeconds: 1869 }, { title: 'Ex 6.3 Q1 (f), (d)', startSeconds: 1940 }, { title: 'Ex 6.3 Q3 (b), (c), (d)', startSeconds: 1996 }, { title: 'Ex 6.3 Q4 (b), (d)', startSeconds: 2066 }],
  'Geometry - Video Lesson': [{ title: 'Introduction: The Triangle and Its Properties - Angle Sum Property of', startSeconds: 0 }, { title: 'Angle Sum Property of a Triangle (Theorem)', startSeconds: 100 }, { title: 'Example 2', startSeconds: 796 }, { title: 'Website Overview', startSeconds: 1058 }],
  'Human Eye and Colourful World - Video Lesson': [{ title: 'The Human Eye and Colourful World Class 10 Science (Physics)', startSeconds: 0 }, { title: 'ANTHE - Aakash National Talent Hunt Exam', startSeconds: 315 }, { title: 'The Human Eye', startSeconds: 430 }, { title: 'Cornea & Aqueous humor', startSeconds: 484 }, { title: 'Restricting or Allowing the passage of light', startSeconds: 605 }, { title: 'The size of the pupil is controlled by the Iris.', startSeconds: 680 }, { title: 'Eye Lens', startSeconds: 824 }, { title: 'Power of Accommodation', startSeconds: 946 }, { title: 'Near Point & Far Point', startSeconds: 1184 }, { title: 'Vitreous Humour', startSeconds: 1294 }, { title: 'Image is formed on the Retina', startSeconds: 1368 }, { title: 'Photoreceptors', startSeconds: 1475 }, { title: 'Optic Nerve', startSeconds: 1646 }, { title: 'Propagation of Light in Human eye', startSeconds: 1787 }, { title: 'Parts of Human Eye', startSeconds: 1837 }, { title: 'MYOPIA (Nearsightedness)', startSeconds: 1873 }, { title: 'Defects of Vision', startSeconds: 1910 }, { title: 'Correction of Myopia', startSeconds: 2221 }, { title: 'HYPERMETROPIA (Farsightedness)', startSeconds: 2262 }, { title: 'Correction of Hypertension', startSeconds: 2371 }],
  'Magnetic Effects of Electric Current - Video Lesson': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Magnetic Field and Field Lines', startSeconds: 405 }, { title: 'Magnetic Field due to Current Carrying Conductor', startSeconds: 1411 }, { title: 'Force on Current Carrying Conductor in Magnetic Field', startSeconds: 3378 }, { title: 'Domestic Electric Circuits', startSeconds: 4252 }],
  'Applications of Trigonometry - Video Lesson': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Class 10th Syllabus', startSeconds: 60 }, { title: 'What To Focus On Strategy', startSeconds: 238 }, { title: 'Must Do', startSeconds: 465 }, { title: 'Resources Video', startSeconds: 557 }, { title: 'Thank You', startSeconds: 685 }],
  'Areas Related to Circles - Video Lesson': [{ title: 'Introduction', startSeconds: 0 }, { title: 'Basics', startSeconds: 53 }, { title: 'Arc', startSeconds: 323 }, { title: 'Sector of a circle and it\'s Area', startSeconds: 554 }, { title: 'Questions', startSeconds: 915 }, { title: 'Minute Hand & Hour Hand', startSeconds: 2545 }, { title: 'Questions', startSeconds: 2798 }, { title: 'Segment of a Circle and It\'s Area', startSeconds: 5346 }, { title: 'Example to find Area of Segments', startSeconds: 5575 }, { title: 'Questions', startSeconds: 5969 }, { title: 'Area of Segment', startSeconds: 7356 }, { title: 'Questions', startSeconds: 7435 }, { title: 'Thank you', startSeconds: 8490 }],
  'Mijbil the Otter - Video Lesson': [{ title: 'Introduction: Mijbil the Otter: Gavin Sandburg', startSeconds: 0 }, { title: 'Mijbil the Otter', startSeconds: 463 }, { title: 'summary of Mijbil the Otter', startSeconds: 4517 }, { title: 'Website Overview', startSeconds: 4959 }],
  'Madam Rides the Bus - Video Lesson': [{ title: 'Introduction: Madam Rides the Bus - Vallikkannan', startSeconds: 0 }, { title: 'What we will Study Today:', startSeconds: 14 }, { title: 'Madam Rides the Bus:', startSeconds: 252 }, { title: 'Summary - Madam Rides the Bus:', startSeconds: 5257 }, { title: 'Website Overview', startSeconds: 5684 }],
};


  const notesTexts: Record<string, string> = {
    'Chemical Reactions - Complete Guide': '## Types of Chemical Reactions\n\n### 1. Combination Reaction\nTwo or more substances combine to form one product.\n2H2 + O2 -> 2H2O\n\n### 2. Decomposition Reaction\nOne substance breaks down into simpler substances.\n2H2O -> 2H2 + O2 (electrolysis)\n\n### 3. Displacement Reaction\nMore reactive element displaces less reactive.\nZn + CuSO4 -> ZnSO4 + Cu\n\n### 4. Double Displacement Reaction\nExchange of ions between two compounds.\nNaCl + AgNO3 -> AgCl + NaNO3\n\n### 5. Oxidation and Reduction (Redox)\nOxidation: Loss of electrons / Gain of oxygen\nReduction: Gain of electrons / Loss of oxygen',
    'Balancing Equations - Practice Problems': '## Practice: Balance the following\n\n1. Mg + O2 -> MgO\n   Answer: 2Mg + O2 -> 2MgO\n\n2. Fe + H2O -> Fe3O4 + H2\n   Answer: 3Fe + 4H2O -> Fe3O4 + 4H2\n\n3. Na + H2O -> NaOH + H2\n   Answer: 2Na + 2H2O -> 2NaOH + H2\n\n## Tips\n- Balance metals first, then non-metals\n- Balance H and O last\n- Use coefficients, never change subscripts\n- Check your answer at the end',
    'Acids and Bases - Study Notes': '## Acids\n- Taste sour, turn blue litmus red\n- Examples: HCl, H2SO4, HNO3, CH3COOH\n- Release H+ ions in water\n- pH < 7\n\n## Bases\n- Taste bitter, turn red litmus blue\n- Examples: NaOH, KOH, Ca(OH)2, NH4OH\n- Release OH- ions in water\n- pH > 7\n\n## Neutralisation\nAcid + Base -> Salt + Water\nHCl + NaOH -> NaCl + H2O\n\n## pH Scale\n0 (Acidic) ... 7 (Neutral) ... 14 (Basic)\n\n## Indicators\n- Litmus: Red (acid) / Blue (base)\n- Phenolphthalein: Colourless (acid) / Pink (base)\n- Methyl orange: Red (acid) / Yellow (base)',
    'pH Scale and Neutralisation': '## pH Scale\n- Measures acidity or alkalinity\n- Range: 0 to 14\n- pH = 7: Neutral (pure water)\n- pH < 7: Acidic\n- pH > 7: Basic\n\n## Strong vs Weak\n- Strong acid: fully ionizes (HCl, H2SO4)\n- Weak acid: partially ionizes (CH3COOH)\n- Strong base: fully ionizes (NaOH, KOH)\n- Weak base: partially ionizes (NH4OH)\n\n## Neutralisation Examples\n- Antacids neutralize stomach acid\n- Lime treatment for acidic soil\n- Washing soda for oily stains',
    'Metals vs Non-metals': '## Properties of Metals\n- Lustrous (shiny)\n- Good conductors of heat and electricity\n- Malleable (can be hammered)\n- Ductile (can be drawn into wires)\n- High melting and boiling points\n- Examples: Fe, Cu, Al, Au\n\n## Properties of Non-metals\n- Dull (non-lustrous)\n- Poor conductors (insulators)\n- Brittle (solids)\n- Low melting points\n- Examples: C, S, P, I2\n\n## Exceptions\n- Mercury is liquid metal\n- Iodine is lustrous non-metal\n- Graphite conducts electricity',
    'Metallurgy and Reactivity': '## Reactivity Series\nK > Na > Ca > Mg > Al > Zn > Fe > Ni > Sn > Pb > H > Cu > Hg > Ag > Au\n\n## Extraction Methods\n1. **Electrolysis**: For reactive metals (Na, Al)\n2. **Reduction with carbon**: For moderate metals (Zn, Fe)\n3. **Roasting/Calcination**: For sulphide ores\n4. **Refining**: Purification of metals\n\n## Corrosion\n- Rusting of iron: Fe + O2 + H2O -> Fe2O3.xH2O\n- Prevention: galvanizing, painting, oiling\n\n## Alloys\nMixtures of metals\n- Brass: Cu + Zn\n- Bronze: Cu + Sn\n- Solder: Pb + Sn',
    'Carbon Bonding - Detailed Notes': '## Covalent Bonding\nCarbon shares electrons to achieve stable configuration.\n\n## Types of Bonds\n- Single bond: C-C (1 shared pair)\n- Double bond: C=C (2 shared pairs)\n- Triple bond: C=C (3 shared pairs)\n\n## Allotropes of Carbon\n- Diamond: Tetrahedral, hardest natural substance\n- Graphite: Hexagonal layers, conductor\n- Fullerene: Spherical C60\n\n## Hydrocarbons\n- **Alkanes**: CnH2n+2 (saturated)\n- **Alkenes**: CnH2n (unsaturated)\n- **Alkynes**: CnH2n-2 (unsaturated)',
    'Organic Chemistry - Functional Groups': '## Functional Groups\nAtoms or groups that determine chemical properties.\n\n| Functional Group | Formula | Name Suffix |\n|---|---|---|\n| Hydroxyl | -OH | -ol (alcohol) |\n| Aldehyde | -CHO | -al (aldehyde) |\n| Ketone | -CO- | -one (ketone) |\n| Carboxyl | -COOH | -oic acid |\n| Ester | -COO- | -oate (ester) |\n\n## Homologous Series\nCompounds with same functional group, differing by CH2 unit.\n\n## Nomenclature\n1. Longest carbon chain = parent\n2. Number to give functional group lowest number\n3. Add suffix for functional group',
    'Modes of Nutrition': '## Autotrophic Nutrition\nOrganisms make their own food.\n- Plants use photosynthesis\n- 6CO2 + 6H2O -> C6H12O6 + 6O2\n\n## Heterotrophic Nutrition\nOrganisms depend on others for food.\n- **Holozoic**: Ingestion, digestion, absorption (humans)\n- **Parasitic**: Lives on host (Cuscuta)\n- **Saprophytic**: Feeds on dead matter (fungi)\n\n## Types of Nutrition\n1. Saprophytic: Fungi, bacteria\n2. Parasitic: Cuscuta, ticks\n3. Symbiotic: Lichen (algae + fungus)\n4. Insectivorous: Venus flytrap',
    'Transport in Humans - Notes': '## Circulatory System\n- Heart pumps blood\n- Blood vessels carry blood\n- Blood transports substances\n\n## Blood Vessels\n- **Arteries**: Carry blood away from heart (oxygenated)\n- **Veins**: Carry blood to heart (deoxygenated)\n- **Capillaries**: Exchange of materials\n\n## Heart\n- Four chambers: 2 atria + 2 ventricles\n- Right side: deoxygenated blood\n- Left side: oxygenated blood\n- Double circulation: pulmonary + systemic\n\n## Blood Components\n- Plasma: Liquid part\n- RBC: Carry oxygen\n- WBC: Fight infections\n- Platelets: Blood clotting',
    'Laws of Reflection - Summary': '## Laws of Reflection\n1. The angle of incidence equals the angle of reflection\n2. The incident ray, reflected ray, and normal all lie in the same plane\n\n## Key Terms\n- **Incident Ray**: Ray falling on the surface\n- **Reflected Ray**: Ray bouncing back\n- **Normal**: Perpendicular to the surface\n- **Angle of Incidence (i)**: Between incident ray and normal\n- **Angle of Reflection (r)**: Between reflected ray and normal\n\n## Image Formation by Plane Mirror\n- Virtual and erect\n- Same size as object\n- Laterally inverted\n- Distance of image = Distance of object',
    'Refraction - Formulas and Examples': '## Snell\'s Law\nn1 sin(i) = n2 sin(r)\n\n## Refractive Index\nn = c/v (speed of light in vacuum / speed in medium)\n\n## Key Phenomena\n- Light bends when entering a denser medium\n- Apparent depth < Real depth\n- Twinkling of stars\n- Mirage formation\n\n## Lenses\n- **Convex**: Converges light, real image\n- **Concave**: Diverges light, virtual image\n- Lens formula: 1/f = 1/v - 1/u\n- Magnification: m = v/u',
    'Ohm\'s Law and Resistance': '## Ohm\'s Law\nV = IR\n\n## Key Terms\n- **V (Voltage)**: Potential difference in Volts\n- **I (Current)**: Flow of charge in Amperes\n- **R (Resistance)**: Opposition to current in Ohms\n\n## Resistance\nR = rho * L / A\n- rho = resistivity (ohm.m)\n- L = length (m)\n- A = cross-sectional area (m^2)\n\n## Factors Affecting Resistance\n1. Length (directly proportional)\n2. Area (inversely proportional)\n3. Material (resistivity)\n4. Temperature',
    'Power, Energy, Joule\'s Law': '## Electric Power\nP = VI = I^2R = V^2/R\n\n## Units\n- Power: Watt (W)\n- Energy: Joule (J) or kilowatt-hour (kWh)\n- 1 kWh = 3.6 x 10^6 J\n\n## Joule\'s Law of Heating\nH = I^2Rt\n- Heat generated is proportional to:\n  - Square of current\n  - Resistance\n  - Time\n\n## Applications\n- Electric heater (nichrome wire)\n- Electric iron\n- Light bulb (filament)',
    'HCF and LCM - Complete Guide': '## Euclid\'s Division Lemma\nFor positive integers a and b, there exist unique q and r such that:\na = bq + r, where 0 <= r < b\n\n## Finding HCF\nRepeatedly apply division lemma:\n- HCF(135, 225): 225 = 135 x 1 + 90\n- 135 = 90 x 1 + 45\n- 90 = 45 x 2 + 0\n- HCF = 45\n\n## LCM\nLCM(a,b) = (a x b) / HCF(a,b)\n\n## Prime Factorization Method\n- 12 = 2^2 x 3\n- 18 = 2 x 3^2\n- HCF = 2 x 3 = 6\n- LCM = 2^2 x 3^2 = 36',
    'Irrational Numbers and Decimals': '## Proving a Number is Irrational\nAssume it is rational, then show contradiction.\n\n## Example: Prove sqrt(2) is irrational\nAssume sqrt(2) = p/q (lowest terms)\nThen 2 = p^2/q^2, so 2q^2 = p^2\nThis means p is even, let p = 2k\nThen 2q^2 = 4k^2, so q^2 = 2k^2\nThis means q is even\nContradiction: p/q was in lowest terms\n\n## Decimal Expansion\n- Rational: Terminating or repeating\n- Irrational: Non-terminating, non-repeating\n- Example: pi = 3.14159...',
    'Polynomial Zeroes - Notes': '## Zero of a Polynomial\nValue of x for which P(x) = 0\n\n## Graphical Method\n- Plot y = P(x)\n- Zero = x-intercept\n\n## Factor Theorem\nIf P(a) = 0, then (x - a) is a factor of P(x)\n\n## Remainder Theorem\nWhen P(x) is divided by (x - a), remainder = P(a)\n\n## Examples\n- P(x) = x^2 - 4, zeros at x = 2 and x = -2\n- P(x) = x^2 - 5x + 6, zeros at x = 2 and x = 3\n- P(x) = x^3 - 1, zero at x = 1',
    'Remainder and Factor Theorem': '## Remainder Theorem\nIf polynomial P(x) is divided by (x - a), the remainder is P(a).\n\n## Factor Theorem\n(x - a) is a factor of P(x) if and only if P(a) = 0.\n\n## Division Algorithm\nP(x) = G(x) * Q(x) + R(x)\n- P(x) = dividend\n- G(x) = divisor\n- Q(x) = quotient\n- R(x) = remainder (degree < degree of G(x))\n\n## Example\nDivide x^3 - 3x^2 + 5x - 3 by (x - 1)\nP(1) = 1 - 3 + 5 - 3 = 0\nSo (x - 1) is a factor',
    'Factoring Quadratics - Methods': '## Method 1: Splitting the Middle Term\nFor ax^2 + bx + c\nFind two numbers that multiply to ac and add to b\n\n## Example\nx^2 + 5x + 6\nFind two numbers that multiply to 6 and add to 5: 2 and 3\n= x^2 + 2x + 3x + 6 = x(x+2) + 3(x+2) = (x+2)(x+3)\n\n## Method 2: Perfect Square\na^2 + 2ab + b^2 = (a+b)^2\na^2 - 2ab + b^2 = (a-b)^2\n\n## Method 3: Difference of Squares\na^2 - b^2 = (a+b)(a-b)\n\n## Method 4: Quadratic Formula\nx = (-b +/- sqrt(b^2 - 4ac)) / 2a',
    'Quadratic Formula and Discriminant': '## Quadratic Formula\nFor ax^2 + bx + c = 0:\nx = (-b +/- sqrt(b^2 - 4ac)) / 2a\n\n## Discriminant (D)\nD = b^2 - 4ac\n\n## Nature of Roots\n- D > 0: Two distinct real roots\n- D = 0: One repeated real root\n- D < 0: No real roots (two complex roots)\n\n## Example\nx^2 - 5x + 6 = 0\na=1, b=-5, c=6\nD = 25 - 24 = 1 > 0\nTwo distinct real roots\nx = (5 +/- 1) / 2 = 3 or 2',
    'AP Formulas and Examples': '## nth Term\nan = a + (n-1)d\n- a = first term\n- d = common difference\n- n = term number\n\n## Sum of n Terms\nSn = n/2 * (2a + (n-1)d)\nor Sn = n/2 * (a + an)\n\n## Examples\nAP: 3, 7, 11, 15, ...\na = 3, d = 4\na10 = 3 + 9(4) = 39\nS10 = 10/2 * (2*3 + 9*4) = 5 * (6 + 36) = 210',
    'Sum of AP - Practice Problems': '## Practice Problems\n\n1. Find the 20th term of: 5, 8, 11, 14...\na = 5, d = 3\na20 = 5 + 19(3) = 62\n\n2. Find the sum of first 15 terms: 2, 5, 8, 11...\na = 2, d = 3\nS15 = 15/2 * (2*2 + 14*3) = 15/2 * (4 + 42) = 15/2 * 46 = 345\n\n3. If a = 7 and d = -3, find the 12th term\na12 = 7 + 11(-3) = 7 - 33 = -26',
    'Trigonometry - Ratios and Table': '## Trigonometric Ratios (Right Triangle)\nsin(theta) = Opposite / Hypotenuse\ncos(theta) = Adjacent / Hypotenuse\ntan(theta) = Opposite / Adjacent\n\n## Reciprocal Ratios\ncosec(theta) = 1/sin(theta)\nsec(theta) = 1/cos(theta)\ncot(theta) = 1/tan(theta)\n\n## Standard Values\n| Angle | sin | cos | tan |\n|---|---|---|---|\n| 0 | 0 | 1 | 0 |\n| 30 | 1/2 | sqrt(3)/2 | 1/sqrt(3) |\n| 45 | 1/sqrt(2) | 1/sqrt(2) | 1 |\n| 60 | sqrt(3)/2 | 1/2 | sqrt(3) |\n| 90 | 1 | 0 | undefined |',
    'Important Trig Identities': '## Fundamental Identity\nsin^2(theta) + cos^2(theta) = 1\n\n## Derived Identities\n1 + tan^2(theta) = sec^2(theta)\n1 + cot^2(theta) = cosec^2(theta)\n\n## Other Identities\nsin(90 - theta) = cos(theta)\ncos(90 - theta) = sin(theta)\ntan(90 - theta) = cot(theta)\n\n## Applications\n- Finding one ratio from another\n- Proving trigonometric equations\n- Simplifying expressions',
    'Central Tendency - Formulas': '## Mean\nFor ungrouped: Mean = Sum of observations / Number of observations\nFor grouped: Mean = Sum(fi*xi) / Sum(fi)\n\n## Median\n1. Arrange in order\n2. If n is odd: Middle value\n3. If n is even: Average of two middle values\n\n## Mode\nMost frequently occurring value\nFor grouped: Mode = L + (f1-f0)/(2f1-f0-f2) * h\n\n## Relationship\nMean - Mode = 2(Mean - Median)\n\n## Example\nData: 2, 3, 5, 5, 7, 8\nMean = 30/6 = 5\nMedian = (5+5)/2 = 5\nMode = 5',
    'Probability - Basic Concepts': '## Classical Probability\nP(Event) = Number of favourable outcomes / Total number of outcomes\n\n## Key Terms\n- **Experiment**: Activity with outcomes\n- **Sample Space**: Set of all outcomes\n- **Event**: Subset of sample space\n- **Favourable Outcome**: Outcome satisfying event\n\n## Properties\n- 0 <= P(E) <= 1\n- P(Sure Event) = 1\n- P(Impossible Event) = 0\n- P(E) + P(not E) = 1\n\n## Example\nTossing a coin: P(head) = 1/2\nRolling a die: P(6) = 1/6',
    'Similarity Criteria - Notes': '## AA Similarity\nIf two angles of one triangle are equal to two angles of another, triangles are similar.\n\n## SAS Similarity\nIf one angle and the including sides are proportional, triangles are similar.\n\n## SSS Similarity\nIf all three sides are proportional, triangles are similar.\n\n## Thales Theorem\nIf a line is drawn parallel to one side of a triangle, it divides the other two sides proportionally.\n\n## Area Ratio\nRatio of areas of similar triangles = square of ratio of corresponding sides',
    'Coordinate Geometry Formulas': '## Distance Formula\nd = sqrt((x2-x1)^2 + (y2-y1)^2)\n\n## Section Formula\nPoint dividing AB in ratio m:n:\nx = (mx2 + nx1)/(m+n), y = (my2 + ny1)/(m+n)\n\n## Midpoint Formula\nM = ((x1+x2)/2, (y1+y2)/2)\n\n## Area of Triangle\nArea = (1/2)|x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|\n\n## Collinearity\nThree points are collinear if area of triangle = 0',
    'Circle Theorems - Summary': '## Key Theorems\n1. Angle at centre = 2 x angle at circumference\n2. Angles in same segment are equal\n3. Angle in semicircle is a right angle\n4. Opposite angles of cyclic quadrilateral sum to 180\n5. Tangent is perpendicular to radius at point of contact\n6. Two tangents from external point are equal\n7. Angle between tangent and chord = angle in alternate segment\n\n## Tangent-Secant\nIf P is external point, PA tangent and PBC secant:\nPA^2 = PB x PC\n\n## Intersecting Chords\nIf two chords AB and CD intersect at P:\nPA x PB = PC x PD',
    'Mensuration Formulas': '## Cylinder\nCSA = 2*pi*r*h\nTSA = 2*pi*r*(r+h)\nVolume = pi*r^2*h\n\n## Cone\nCSA = pi*r*l (l = slant height)\nTSA = pi*r*(r+l)\nVolume = (1/3)*pi*r^2*h\n\n## Sphere\nSA = 4*pi*r^2\nVolume = (4/3)*pi*r^3\n\n## Hemisphere\nCSA = 2*pi*r^2\nTSA = 3*pi*r^2\nVolume = (2/3)*pi*r^3\n\n## Frustum\nV = (1/3)*pi*h*(R^2 + r^2 + R*r)',
    'Plants and Animals - Study Notes': '## Parts of a Plant\n- **Root**: holds the plant in the soil and takes in water and minerals.\n- **Stem**: carries water and food upwards and holds the leaves up.\n- **Leaves**: make food using sunlight and give out oxygen.\n\n## Flowers and Fruits\n- The flower is the reproductive part of the plant.\n- After fertilisation the flower turns into a fruit; the fruit holds the seeds.\n\n## Domestic and Wild Animals\n- **Domestic animals** live with people and are useful to us: cow, goat, dog, hen.\n- **Wild animals** live in forests and cannot be tamed: lion, tiger, elephant, deer.\n- Every animal needs food, water, shelter and space to move about.',
    'Our Body and Food - Study Notes': '## Parts of the Body\n- The body is made of many parts that work together: head, trunk and limbs.\n- The **skeletal system** gives the body its shape; the **muscular system** moves the bones.\n\n## Senses\n- **Sight** - eyes | **Hearing** - ears | **Smell** - nose | **Taste** - tongue | **Touch** - skin.\n- The sense organs collect information and send it to the brain, which decides what to do.\n\n## Balanced Diet\n- Food gives us energy, helps growth and protects us from disease.\n- A balanced diet has carbohydrates (rice, roti), proteins (dal, milk, eggs), fats (oils), vitamins and minerals (fruits and vegetables) and plenty of water.\n- Fruits and vegetables should be eaten every day; junk food should be avoided.',
    'Numbers up to 100 - Study Notes': '## Before and After\n- The number before 40 is **39**; the number after 40 is **41**.\n- Counting forward adds 1; counting backward takes away 1.\n\n## Greater and Smaller\n- A bigger number is **greater** (>) and a smaller number is **less** (<).\n- 75 > 47, so 75 is greater than 47.\n\n## Single and Double Digit Numbers\n- **Single digit** numbers run from 0 to 9 and have only one place.\n- **Double digit** numbers run from 10 to 99: a tens place and a ones place.\n- In 56, 5 is the tens digit and 6 is the ones digit.',
    'Shapes and Patterns - Study Notes': '## Basic Shapes\n- **Circle** - round, no corner: a wheel, a coin, a plate.\n- **Square** - 4 equal sides and 4 corners.\n- **Triangle** - 3 sides and 3 corners.\n- **Rectangle** - 4 sides; opposite sides are equal.\n\n## Patterns\n- A **number pattern** repeats in a fixed order: 2, 4, 6, 8, 10 (add 2 each time).\n- A **shape pattern** repeats in a fixed order: circle, square, triangle, circle, square...\n- Finding the rule behind a pattern lets us find the next number or shape quickly.',
    'Plants Around Us - Study Notes': '## Types of Plants\n- **Trees** are tall with a thick woody stem: mango, neem, banyan.\n- **Shrubs** are shorter than trees with many branches: hibiscus, lemon.\n- **Herbs** are small and soft: tomato, coriander, mint.\n\n## Parts of a Flower\n- **Sepals** protect the bud, **petals** attract insects, the **stamen** is the male part and the **pistil** the female part.\n- The ovary of the flower later becomes the fruit.\n\n## Plant Needs\n- Plants need sunlight, water, air and soil to grow.\n- **Photosynthesis**: leaves use sunlight to make food from carbon dioxide and water, releasing oxygen.\n- Soil holds water and minerals and gives the plant a place to stand.',
    'Animals and Their Young - Study Notes': '## Life Cycles\n- Every animal grows from a young one into an adult.\n- **Metamorphosis** is a life cycle in which the young looks quite different from the adult: frog -> tadpole -> frog, butterfly -> caterpillar -> pupa -> butterfly.\n\n## Mothers and Babies\n- The mother of a cow is a cow, of a hen a hen, of a dog a bitch and of a lion a lioness.\n- Puppies are born blind and helpless; they open their eyes after about ten days.\n\n## Animal Groups\n- A **herd** of cows, a **flock** of sheep or birds, a **pack** of wolves, a **swarm** of bees and a **school** of fish.',
    'Numbers up to 1000 - Study Notes': '## Place Value\n- 342 = 3 hundreds + 4 tens + 2 ones.\n- The **expanded form** of 342 is 300 + 40 + 2.\n\n## Three Digit Numbers\n- Every three digit number has hundreds, tens and ones places.\n- 509 = 5 hundreds + 0 tens + 9 ones.\n\n## Carrying and Borrowing\n- **Carrying**: 47 + 6 = 53 (carry 1 ten across).\n- **Borrowing**: 52 - 8 = 44 (borrow 1 ten).\n- Always check the answer by adding back.',
    'Introduction to Multiplication - Study Notes': '## Repeated Addition\n- Multiplication is a **short way of adding equal groups**.\n- 4 + 4 + 4 = 12, so 3 x 4 = 12.\n\n## Array Model\n- An array shows rows and columns of equal objects: 3 rows of 4 is 3 x 4 = 12.\n\n## Tables of 2, 5 and 10\n- **Table of 2**: 2, 4, 6, 8, 10 (add 2 each step).\n- **Table of 5**: 5, 10, 15, 20, 25 (add 5 each step).\n- **Table of 10**: 10, 20, 30, 40 (add 10 each step).',
    'The World of Plants - Study Notes': '## Germination\n- Germination is the sprouting of a seed into a tiny plant.\n- A seed germinates when it has water, air and a suitable temperature.\n\n## Parts and Functions\n- **Roots** fix the plant and absorb water; **stem** carries food and water; **leaves** make food.\n- The **flower** produces seeds and the **fruit** protects them.\n\n## Food from Plants\n- Rice, wheat, potato, sugarcane, dal, groundnut, fruits and vegetables all come from plants.\n\n## Medicinal Plants\n- Tulsi cures cough and cold, neem is used for skin diseases, ginger for sore throat, turmeric for wounds and asafoetida for digestion.',
    'The Human Body - Study Notes': '## Bones and Joints\n- The **skeleton** gives the body its shape, protects delicate organs and helps in movement.\n- **Joints** are the places where two bones meet: the hinge joint of the elbow, the ball and socket joint of the shoulder.\n- A **skeletal muscle** is attached to a bone; when it contracts it pulls the bone and the body moves.\n\n## Mouth to Stomach\n- Food travels mouth -> oesophagus -> stomach -> small intestine -> large intestine.\n- The stomach churns food and mixes it with gastric juice; the small intestine takes in the digested food.\n\n## Teeth and Chewing\n- **Incisors** cut, **canines** tear, **premolars** crush and **molars** grind.\n- Adult humans normally have 32 teeth; brushing twice a day keeps them healthy.',
    'Properties of Materials - Study Notes': '## Hard and Soft\n- **Hard** materials cannot be easily scratched or cut: iron, wood, stone.\n- **Soft** materials can be pressed or cut easily: clay, rubber, cloth.\n\n## Transparent and Opaque\n- **Transparent** materials let light pass through: glass, water, clear plastic.\n- **Opaque** materials block light: wood, metal, cardboard.\n\n## Sorting Materials\n- By **shape**: round, square, triangular, rectangular.\n- By **use**: things we drink, things we wear, things we build with.\n- Materials can have more than one property - a glass tumbler is transparent, hard and smooth.',
    'Numbers up to 10000 - Study Notes': '## Thousands and Hundreds\n- 4537 = 4 thousands + 5 hundreds + 3 tens + 7 ones.\n- 4537 > 3999 because the thousands digit is greater.\n\n## Comparing Numbers\n- Compare from the largest place value first: thousands, then hundreds, then tens, then ones.\n\n## Roman Numerals\n- I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.\n- A symbol is **subtracted** when it is placed before a larger one (IV = 4) and **added** when it follows a larger one (VI = 6).',
    'Multiplication and Division - Study Notes': '## Two Digit Multiplication\n- 23 x 14 = 23 x (10 + 4) = 230 + 92 = 322.\n- Multiply the tens first, then the ones, and add the two partial products.\n\n## Properties\n- **Commutative**: 4 x 6 = 6 x 4. **Associative**: (2 x 3) x 4 = 2 x (3 x 4).\n- **Distributive**: 7 x 12 = 7 x 10 + 7 x 2.\n\n## Division and Remainder\n- 45 divided by 7 gives quotient 6 and remainder 3.\n- The divisor x quotient + remainder = dividend: 7 x 6 + 3 = 45.',
    'Food and Nutrition - Study Notes': '## Components of Food\n- **Carbohydrates** give energy (rice, roti, potato).\n- **Proteins** help growth and repair the body (dal, milk, eggs, groundnut).\n- **Fats** give energy and protect the organs (oils, butter, ghee).\n\n## Vitamins and Minerals\n- **Vitamin A** (carrot, papaya) for the eyes, **Vitamin C** (citrus) for immunity, **Vitamin D** (sunlight, milk) for strong bones.\n- **Iron** (spinach, jaggery) for blood, **Iodine** (salt) for the thyroid, **Calcium** (milk) for bones and teeth.\n\n## Food Groups and Malnutrition\n- A balanced plate has grains, pulses, vegetables, fruit, milk and some fat.\n- **Malnutrition** (too little or too much of a nutrient) weakens the body and causes deficiency diseases.',
    'The Living World - Study Notes': '## Land and Water Habitats\n- **Terrestrial habitats**: forest, grassland, desert, mountain, cropland.\n- **Aquatic habitats**: ponds and lakes (still water), rivers and seas (moving water).\n\n## Adaptation\n- Adaptation is the way an organism adjusts to its surroundings.\n- Camels have long legs and store fat in the hump for the desert; fish have streamlined bodies and gills for water; cactus stores water and has a thick waxy skin.\n\n## Food Chains\n- **Producers** (green plants) make their own food; **consumers** eat plants or other animals.\n- **Decomposers** (bacteria, fungi) break down dead plants and animals and return minerals to the soil.',
    'Large Numbers - Study Notes': '## Place Value and the Indian System\n- Ones, tens, hundreds, thousands, **ten thousands, lakhs, ten lakhs, crores**.\n- 3,45,678 is 3 lakhs, 45 thousand and 678.\n- 23,45,678 is 23 lakhs, 45 thousand and 678.\n\n## Rounding Off\n- 47 rounds off to 50; 423 rounds off to 400; 3,675 rounds off to 3,700.\n\n## Estimation\n- Estimate 198 + 247 by rounding to 200 + 250 = 450.\n- Estimation is a quick check that the answer is sensible.',
    'Operations on Numbers - Study Notes': '## Multi-digit Addition and Subtraction\n- Add like place values and carry; subtract with borrowing.\n- 4,786 + 3,215 = 8,001.\n\n## Properties\n- **Commutative** (4 + 9 = 9 + 4) and **Associative** ((2 + 3) + 4 = 2 + (3 + 4)) for addition and subtraction.\n- Multiplication is commutative and associative; division is neither.\n\n## Word Problems and Patterns\n- Read the problem, choose the operation, estimate the answer, then solve and check.\n- Multiplying by 10, 100 and 1000 shifts the digits one, two and three places to the left.',
    'The World of Living Things - Study Notes': '## Life Cycles\n- **Butterfly**: egg -> caterpillar (larva) -> pupa (cocoon) -> adult butterfly.\n- **Frog**: egg -> tadpole -> tadpole with legs -> froglet -> adult frog.\n- **Plant**: seed -> seedling -> mature plant -> flower -> seed.\n\n## Pond Life\n- Pond water is a **still water** habitat: algae, water plants, fish, frogs, snails, insects and water birds.\n- There is plenty of sunlight, water and plants at the top and less light deeper down.\n\n## Forest Life\n- A forest is a **land habitat** with many layers: canopy, understorey, shrubs and forest floor.\n- Animals are adapted to the layer they live in - eagles to the canopy, deer to the floor.',
    'Materials: Pure and Mixed - Study Notes': '## Filtration and Evaporation\n- **Filtration** separates an insoluble solid from a liquid (chalk from water, tea leaves from tea).\n- **Evaporation** separates a soluble solid from a liquid by heating (salt from sea water).\n\n## Sieving\n- A sieve separates particles of different sizes; a mesh traps larger pieces while the fine ones fall through.\n\n## Conductors and Insulators\n- **Conductors** allow heat and electricity to pass: metals, graphite.\n- **Insulators** do not: wood, plastic, rubber, glass, dry wood.\n\n## Magnetic Materials\n- Iron, nickel and cobalt are magnetic; they are attracted by a magnet and can be magnetised.\n- Copper, aluminium, wood and plastic are not attracted by a magnet.',
    'Forces and Energy - Study Notes': '## Simple Machines\n- A **lever** is a rigid bar turning about a fixed point (crowbar, seesaw, scissors).\n- A **pulley** makes lifting easier (drawing a flag, a well).\n- An **inclined plane** reduces the force needed to lift a load (a ramp).\n\n## Light and Shadows\n- Light travels in a straight line - **rectilinear propagation**.\n- An object blocks the light and forms a shadow.\n- A **pinhole camera** uses a small hole to form an inverted image on a screen.\n\n## Energy\n- Energy can change form but not be destroyed. Light energy from the sun becomes chemical energy in plants.',
    'Numbers and Operations - Study Notes': '## Numbers up to Crores\n- 45,67,892 is 4 crores, 5 lakhs, 67 thousand and 892.\n- 1 crore = 100 lakhs; 1 lakh = 100 thousand.\n\n## Place Value\n- In 45,67,892 the digits stand for 4 crores, 5 lakhs, 6 ten-thousands, 7 thousands, 8 hundreds, 9 tens and 2 ones.\n\n## HCF and LCM\n- **HCF** of 12 and 18 is 6; **LCM** of 12 and 18 is 36.\n- Prime factorisation: 12 = 2 x 2 x 3 and 18 = 2 x 3 x 3, so HCF = 6 and LCM = 2 x 2 x 3 x 3 = 36.\n\n## Order of Operations\n- Brackets first, then division, then multiplication, then addition and subtraction.',
    'Fractions and Decimals - Study Notes': '## Adding and Subtracting Fractions\n- Add like fractions: 2/5 + 1/5 = 3/5.\n- For unlike fractions make the denominators the same: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.\n\n## Mixed Numbers\n- A **mixed number** is a whole number plus a fraction: 2 3/4.\n- Convert: 2 3/4 = (2 x 4 + 3)/4 = 11/4.\n\n## Tenths and Hundredths\n- 1/10 = 0.1, 1/100 = 0.01, so 3/10 = 0.3 and 7/100 = 0.07.\n- 5.35 = 5 + 3/10 + 5/100.\n\n## Money\n- Money is written in two decimal places: Rs 25.50.\n- Add and subtract money exactly like decimals, keeping the decimal point lined up.',
    'Geometry and Mensuration - Study Notes': '## 3D Shapes\n- A **cube** has 6 square faces, 12 edges and 8 vertices; all edges are equal.\n- A **cuboid** has 6 rectangular faces, 12 edges and 8 vertices.\n- A **cylinder** has 2 circular faces and 1 curved surface; a **sphere** has 1 curved surface and no flat face.\n\n## Area and Perimeter\n- **Perimeter** = sum of all sides; **Area** = space covered.\n- Perimeter of a rectangle = 2 x (length + breadth); Area = length x breadth.\n- Area of a square = side x side.\n\n## Simple Formulas\n- Volume of a cube = side^3; volume of a cuboid = length x breadth x height.',
    'The World of the Living - Study Notes': '## Kingdoms\n- Living things are grouped into five kingdoms: **Monera, Protista, Fungi, Plantae and Animalia**.\n- Plants are further divided into Thallophyta, Bryophyta, Pteridophyta, Gymnosperms and Angiosperms.\n\n## Vertebrates and Invertebrates\n- **Vertebrates** have a backbone (fish, frog, bird, mammal).\n- **Invertebrates** have no backbone (insects, snails, jellyfish, worms).\n\n## Flowering and Non-flowering Plants\n- **Angiosperms** flower and their seeds stay inside the fruit; **gymnosperms** bear cones.\n- Non-flowering plants such as ferns and mosses reproduce by spores.\n\n## Leaf Shapes\n- Leaves may be simple or compound, and their margin may be smooth (entire), toothed (serrate) or lobed.',
    'Body Movements - Study Notes': '## Bones and Muscles\n- The **skeleton** (206 bones) gives shape and protects organs; **muscles** pull on the bones to produce movement.\n- A muscle works by contracting and relaxing; it can only pull, never push.\n\n## Joint Types\n- **Hinge joint** - elbow and knee, movement in one plane.\n- **Ball and socket joint** - shoulder and hip, movement in all directions.\n- **Pivot joint** - neck, turns the head; **fixed joint** - skull, no movement.\n\n## Movement in Animals\n- Fish swim with fins and a powerful tail; birds fly with wings and a light hollow skeleton; earthworms move with tiny bristles (setae) and stretch and contract.',
    'Basic Geometrical Ideas - Study Notes': '## Points, Lines and Planes\n- A **point** marks a position (A). A **line** has no end point; a **line segment** has two end points.\n- A **ray** has one end point and extends in one direction forever.\n- Two lines meet at a point; a plane is a flat surface with no edge.\n\n## Measuring Angles\n- An angle is measured in degrees with a **protractor**: a full turn is 360 degrees.\n- The **vertex** is the corner point and the two arms are the sides of the angle.\n\n## Types of Angles\n- **Acute** < 90 degrees, **Right** = 90 degrees, **Obtuse** between 90 and 180, **Straight** = 180, **Reflex** between 180 and 360.',
    'Integers - Study Notes': '## The Number Line\n- On the number line, positive numbers go to the right and negative numbers to the left.\n- **-3** is to the left of 0 and **3** is to the right; 0 is neither positive nor negative.\n\n## Addition\n- Adding a positive number moves right, adding a negative number moves left.\n- 7 + (-4) = 3; 7 + (-9) = -2.\n\n## Subtraction and Word Problems\n- Subtraction is the opposite of addition: a - (-b) = a + b.\n- The temperature fell from -2 degrees to -7 degrees; the drop was 5 degrees.',
    'Algebra - Study Notes': '## Using Letters\n- A letter stands for an unknown number: in 3x + 5, x is the variable.\n- **Constants** have a fixed value (5); **terms** are separated by + or - (3x and 5).\n\n## Simple Equations\n- 5x = 20, so x = 4.\n- Keep the balance: whatever is done to one side must be done to the other.\n\n## Patterns\n- **Number pattern**: 2, 4, 6, 8, 10 - the rule is "add 2".\n- **Visual pattern**: a repeating shape or colour sequence.',
    'Nutrition in Living Organisms - Study Notes': '## Photosynthesis\n- **6CO2 + 6H2O -> (sunlight, chlorophyll) C6H12O6 + 6O2**.\n- Carbon dioxide and water are taken in by the leaves and food (glucose) and oxygen are produced.\n- Only green plants make their own food, so they are the base of every food chain.\n\n## Chlorophyll\n- Chlorophyll is the green pigment in the leaves that traps sunlight.\n- A variegated leaf in light shows that only the green parts make starch.\n\n## Alimentary Canal\n- Mouth -> oesophagus -> stomach -> small intestine -> large intestine.\n- The small intestine absorbs digested food; the large intestine absorbs water.\n\n## Enzymes\n- Enzymes are chemicals that speed up digestion: **salivary amylase** in the mouth, **pepsin** in the stomach, **trypsin** and **lipase** in the small intestine.',
    'Heat and Temperature - Study Notes': '## Conduction, Convection and Radiation\n- **Conduction**: heat passes through a solid without the particles moving (a metal spoon in hot tea).\n- **Convection**: heat is carried by moving liquid or gas particles (sea breeze, boiling water).\n- **Radiation**: heat travels as electromagnetic waves without a medium (sunlight, the heat of a fire).\n\n## Thermometer\n- A thermometer measures temperature in degrees Celsius using a liquid column that expands on heating.\n- The normal human body temperature is **37 degrees C**.\n\n## Body Temperature\n- The body keeps its temperature steady by sweating, shivering and by the blood carrying heat around.\n- A fever is a body temperature above the normal range.',
    'Electric Current and Circuits - Study Notes': '## Components of a Circuit\n- A circuit needs a **source** (cell or battery), **conductors** (wire), a **switch** and a **load** (bulb).\n- The circuit must be **closed** for current to flow.\n\n## Series and Parallel\n- **Series**: the components are joined one after another; if one is removed the whole circuit stops.\n- **Parallel**: each component has its own path; one can be removed without affecting the others.\n\n## Conductors and Insulators\n- Copper, aluminium and iron are conductors; rubber, plastic and wood are insulators.\n- Switches and the wiring of a house use plastic and rubber coverings for safety.\n\n## Safety\n- Never touch a switch with wet hands, and never plug too many appliances into one socket.',
    'Integers and Fractions - Study Notes': '## Multiplication and Division of Integers\n- (-3) x (-4) = 12 (a negative times a negative is positive).\n- (-24) / 6 = -4; 24 / (-6) = -4; (-24) / (-6) = 4.\n\n## Properties\n- **Commutative**: a x b = b x a. **Distributive**: a x (b + c) = a x b + a x c.\n- The additive identity is 0 and the multiplicative identity is 1.\n\n## Comparing Rational Numbers\n- 3/4 = 9/12, so fractions with different denominators are compared by converting to a common denominator.\n- -2/3 < 0 < 1/3.\n\n## Operations with Rational Numbers\n- 1/2 + 1/3 = 5/6; 5/6 - 1/6 = 4/6 = 2/3.\n- A rational number is any number that can be written as p/q with q not equal to 0.',
    'Linear Equations - Study Notes': '## Solving for the Unknown\n- In 3x + 5 = 20, subtract 5 from both sides to get 3x = 15, then divide by 3 to get x = 5.\n- The **solution** is the value of x that satisfies the equation; substitute it back to check.\n\n## Word Problems\n- Read the problem, write the equation, solve it and check the answer against the question.\n- "The sum of three consecutive numbers is 42" becomes x + (x + 1) + (x + 2) = 42.\n\n## Transposing\n- Move terms from one side to the other and change their signs: 2x + 5 = 11 becomes 2x = 6.\n- The same operation must be done to every term of the equation.\n\n## Checking Solutions\n- Substitute the answer: for x = 3 in 2x + 4 = 10, 6 + 4 = 10, so x = 3 is correct.',
    'Geometry - Study Notes': '## Types of Triangles by Angles\n- **Acute triangle**: all angles < 90 degrees.\n- **Right triangle**: one angle = 90 degrees.\n- **Obtuse triangle**: one angle > 90 degrees.\n\n## Angle Sum Property\n- The three angles of a triangle add up to **180 degrees**.\n- An equilateral triangle has 60 degree angles; an isosceles triangle has two equal angles.\n\n## Perimeter and Area\n- **Perimeter** of a rectangle = 2 x (length + breadth); **Area** = length x breadth.\n- Area of a triangle = 1/2 x base x height.\n\n## Composite Shapes\n- Break a composite shape into rectangles, squares and triangles, find each area and add them.',
    'Control and Coordination - Study Notes': '## Neurons\n- A neuron is the structural and functional unit of the nervous system: dendrites receive, the axon carries the impulse.\n- Impulses travel as electrical signals along the nerve and are carried by chemical messengers at the synapse.\n\n## Reflex Arc\n- A reflex action is a rapid, automatic response: receptors -> sensory neuron -> spinal cord -> motor neuron -> muscle.\n- The brain is informed afterwards, but the response happens without it.\n\n## Endocrine Glands\n- **Pituitary** (growth hormone), **thyroid** (iodine and thyroxine), **adrenal** (adrenaline), **pancreas** (insulin), **testes** and **ovaries** (sex hormones).\n- The hormones are carried by the blood to the target organs.\n\n## Feedback Mechanism\n- The body checks the level of a hormone and produces more or less of it, keeping the internal environment constant.\n- Too much blood sugar makes the pancreas release more insulin, which lowers the sugar level.',
    'How do Organisms Reproduce? - Study Notes': '## Binary Fission\n- In binary fission the parent cell divides into two equal daughter cells: Amoeba, Leishmania, bacteria.\n- The nucleus divides first and then the cytoplasm.\n\n## Budding\n- A bud grows on the parent and later detaches as a new organism: yeast, hydra, corals.\n\n## Flower Parts\n- **Stamen** (male) has the anther and pollen; **pistil** (female) has the stigma, style and ovary.\n- **Pollination** is the transfer of pollen from the anther to the stigma, by wind, water or insects.\n\n## Fertilisation and Seed Dispersal\n- After fertilisation the ovule becomes the seed and the ovary becomes the fruit.\n- Seeds are dispersed by wind, water, animals and explosion so that they do not all fall in one place.',
    'Heredity and Evolution - Study Notes': '## Dominant and Recessive\n- Mendel worked on pea plants and discovered that traits are governed by factors now called genes.\n- A **dominant** trait (tall plants, T) shows in the offspring even if only one copy is present; a **recessive** trait (short plants, t) shows only when both copies are recessive.\n\n## Punnett Square\n- TT x tt gives all tall (Tt) offspring; Tt x Tt gives 3 tall : 1 short.\n- A **Punnett square** shows all the possible combinations of the parents\' gametes.\n\n## Natural Selection\n- Organisms that are better suited to their surroundings survive and reproduce, passing on their traits.\n- Over many generations this changes the population - for example, the peppered moth.\n\n## Speciation\n- New species arise when populations of the same species are separated and change so much that they can no longer reproduce with each other.',
    'Human Eye and Colourful World - Study Notes': '## Retina and Lens\n- The **retina** has three layers: the outer layer of photoreceptors (rods and cones), the middle layer and the inner layer with nerve fibres.\n- The **image** formed on the retina is inverted and real; the brain turns it the right way up.\n- The **ciliary muscles** change the curvature of the lens to focus near and far objects.\n\n## Defects of Vision\n- **Myopia** (short-sightedness): the image forms in front of the retina; corrected with a **concave** lens.\n- **Hypermetropia** (long-sightedness): the image forms behind the retina; corrected with a **convex** lens.\n- **Presbyopia** (old-age near-sightedness) is corrected with bifocal lenses.\n\n## Dispersion\n- White light splits into seven colours VIBGYOR when it passes through a prism.\n- **Red** is scattered the least and **violet** the most; a rainbow is natural dispersion of sunlight by water droplets.',
    'Magnetic Effects of Electric Current - Study Notes': '## Magnetic Field\n- A current-carrying wire behaves like a magnet and has a magnetic field around it.\n- **Field lines** never cross each other and are denser where the field is stronger.\n- Iron filings sprinkled on paper around a wire trace the pattern of the field.\n\n## Right-Hand Thumb Rule\n- Point the thumb of the right hand along the current; the curl of the fingers shows the direction of the magnetic field.\n- The direction of the field reverses when the current reverses.\n\n## Faraday\'s Law\n- A current is induced in a coil when the magnetic flux through the coil changes.\n- The induced current is larger when the change is faster and when there are more turns in the coil.\n\n## Generators\n- A generator converts mechanical energy into electrical energy using a coil rotating in a magnetic field.\n- The current produced is alternating (AC) and is stepped up for transmission.',
    'Our Environment - Study Notes': '## Food Chains\n- A **food chain** shows who eats whom: grass -> grasshopper -> frog -> snake -> eagle.\n- **Producers** make their own food; **consumers** eat plants or animals; **decomposers** break down dead matter.\n- Energy flows in one direction through the chain and is lost as heat at every level.\n\n## Biogeochemical Cycles\n- The **carbon cycle**, **water cycle** and **nitrogen cycle** move elements between the atmosphere, living things, soil and water.\n- Carbon returns to the air through respiration and decomposition.\n\n## Ozone Depletion\n- Ozone (O3) in the upper atmosphere absorbs harmful ultraviolet radiation.\n- Chlorofluorocarbons (CFCs) used in fridges and fire extinguishers destroy the ozone layer, causing skin cancer and cataract.\n\n## Global Warming\n- Greenhouse gases such as carbon dioxide and methane trap heat and raise the average temperature.\n- This melts polar ice, raises sea levels, changes rainfall and increases the frequency of heat waves and floods.',
    'Pair of Linear Equations in Two Variables - Study Notes': '## Consistent and Inconsistent\n- Two equations are **consistent** when they have a unique common solution, and **inconsistent** when they have no common solution.\n- If both equations represent the same line they have infinitely many solutions (the lines are **coincident**).\n\n## Plotting Points\n- Plot each equation on the same graph; the point where the two lines meet is the solution.\n- A line that is vertical has no graph and no solution.\n\n## Substitution and Elimination\n- **Substitution**: solve one equation for one variable and put that value into the other equation.\n- **Elimination**: multiply the equations so that the coefficients of one variable match, then add or subtract.\n\n## Cross Multiplication\n- For a x + b y = c and d x + e y = f, multiply the first by e and the second by b and subtract.\n- 2x + 3y = 11 and x + 2y = 8 give x = 1, y = 3.',
    'Applications of Trigonometry - Study Notes': '## Angle of Elevation\n- The **angle of elevation** is the angle between the line of sight and the horizontal.\n- When the height of an object and its shadow are known: tan = height / shadow.\n\n## Angle of Depression\n- The **angle of depression** is the angle between the horizontal and the downward line of sight; it is equal to the angle of elevation from the other side.\n- sin = height / hypotenuse.\n\n## Word Problems\n- Draw a right triangle, label the sides, then choose the ratio that matches the two known sides.\n- Always check that the answer is sensible: an angle must lie between 0 and 90 degrees.\n\n## Surveying\n- Surveyors use trigonometry to find the height of a building from a measured shadow, or the distance to a tower.\n- tan 30 = 1/sqrt(3), tan 45 = 1, tan 60 = sqrt(3).',
    'Constructions - Study Notes': '## Internal Division\n- To divide a line segment AB in the ratio 2:3, draw a ray from A, mark 5 equal parts, join the 5th point to B and draw a parallel through the 2nd point.\n- The point where the parallel meets AB divides it in the ratio 2:3.\n\n## Golden Ratio\n- A line segment is divided in the **golden ratio** when the whole is to the longer part as the longer part is to the shorter part.\n- The golden ratio is approximately 1.618 and is called the "divine proportion".\n\n## Tangent from an External Point\n- To draw a tangent from a point P outside a circle with centre O: join OP, find its midpoint M and draw the circle with centre M and radius MO.\n- The line MP cuts the given circle at T; PT is the required tangent because OT is perpendicular to PT.',
    'Areas Related to Circles - Study Notes': '## Arc Length\n- **Arc length** of a sector = (theta/360) x 2 x pi x r.\n- For a quarter circle of radius 7 cm: (90/360) x 2 x (22/7) x 7 = 11 cm.\n\n## Sector Area\n- **Area of a sector** = (theta/360) x pi x r^2.\n- Area of a semicircle = (1/2) x pi x r^2.\n\n## Minor and Major Segments\n- The **minor segment** is the smaller region cut off by a chord; the **major segment** is the larger one.\n- Area of segment = area of the sector - area of the triangle.\n\n## Composite Figures\n- For a shape made of a circle and a square, find the area of each part and add or subtract as needed.',
    'A Letter to God - Study Notes': '## Lencho and the Ruined Harvest\n- Lencho is a poor farmer who works hard on his corn field; he believes that God will always send the rain.\n- A sudden rainstorm with hail destroys his entire crop, and Lencho falls ill with anger and grief.\n\n## The Letter to God\n- Lencho writes a letter to God asking for one hundred pesos, because his family cannot live without the crop.\n- The postman cannot deliver a letter addressed to God, but he promises to post it anyway, and he shows the letter to the village people.\n\n## Humble Faith and Hope\n- Lencho\'s faith is absolute: "God cannot fail to keep his promise of rain."\n- His request of a hundred pesos is asked for in a humble, trusting tone, and the whole village is moved by it.\n\n## Irony in the Story\n- The letters are collected by the postmaster, who raises the hundred pesos by telling people that God has answered Lencho\'s letter.\n- The irony is that no God sends the money - human kindness does, and Lencho never learns the truth.',
    'Nelson Mandela: Long Walk to Freedom - Study Notes': '## Apartheid and the Struggle\n- Apartheid was the political system in South Africa that separated people by race.\n- Mandela spent 27 years in prison and his African National Congress fought for equal rights for all.\n\n## The Inauguration of Freedom\n- On 10 May 1994 the first democratic elections were held in South Africa and the ANC won 252 of the 400 seats.\n- Mandela became South Africa\'s first black President and spoke of a "new dawn" for the country.\n\n## Rhetoric of Freedom and Equality\n- The extract uses repeated phrases, parallelism and contrast to build emotion.\n- Key images: "the sun never sets on the horizon of human generosity", "the bright light of hope".\n\n## Values of Sacrifice and Leadership\n- Mandela chose reconciliation over revenge and asked his people to forgive.\n- The lesson is that freedom costs sacrifice and that a leader must serve the people.',
    'Two Stories about Flying - Study Notes': '## His First Flight\n- A young seagull is afraid to fly although his brothers and sister have already left the ledge.\n- His family threatens to let him starve; he finally takes a run, flaps his wings and learns to fly.\n- The lesson is that fear is overcome by courage and practice, not by waiting for the fear to go.\n\n## The Flying Machine\n- A pilot loses his way in a storm; a radar operator and the ground crew talk him back to the airport.\n- The machine is saved by teamwork and calm, not by speed.\n\n## Courage and Overcoming Fear\n- Both stories show a character facing fear and finding the strength to act.\n- The seagull\'s family creates the pressure that makes him try.\n\n## Descriptive Writing and Imagery\n- The seagull story uses vivid images of the sea, the sky and the vast expanse below the ledge.\n- The flying machine story uses technical detail about the aeroplane and the radio, which creates tension.',
    'From the Diary of Anne Frank - Study Notes': '## Anne Frank and the War\n- Anneliese Marie Frank was a German Jewish girl who wrote this diary while hiding in Amsterdam during the German occupation of the Netherlands.\n- She was given the diary for her thirteenth birthday, on 12 June 1942, and her last entry is 1 August 1944.\n\n## Life in Hiding\n- The family hid in concealed rooms in Otto Frank\'s office building for two years.\n- They were betrayed in August 1944 and transported to concentration camps; Anne died of typhus in Bergen-Belsen and only Otto survived.\n\n## Diary Entry Style\n- The entries are dated and use the present tense, direct speech and short exclamations such as "I still don\'t understand".\n- Anne writes to an imaginary friend "Kitty" and mixes personal news with school work and gossip.\n\n## Hope and Humanity in Adversity\n- Even in hiding Anne writes about school friends, birthdays and the beauty of the rain.\n- She keeps hoping for the war to end and for the day when she can be a teacher or a journalist.',
    'Glimpses of India - Study Notes': '## A Baker from Goa\n- The Portuguese ruled Goa and introduced bread, buns and the tradition of the family baker.\n- The baker still rings his bamboo in the morning, goes out on his selling round and later collects his bills at the end of the day.\n- The narrator remembers buying buns from the pader, and the Portuguese loaf that "still reminds us of the good old days".\n\n## The Bangle Sellers\n- In Fatehpur, a community of bangle sellers moves to the city of Lucknow during the wedding season and sells bangles on the roadside.\n- The story follows the women through the day and shows how their simple lives bring them a quiet dignity.\n\n## Portuguese Heritage in Goa\n- Portuguese influence shows in Goan food (breads, vindaloo, bebinca), the church, the font and the family baker.\n- The baker is a living link with the past, even though the Portuguese are gone.\n\n## Words of Trade and Daily Life\n- Useful words: **baker**, **pader**, **loaf**, **bun**, **bill**, **customer**, **dough**, **bangles**, **rural**, **urban**.',
    'Mijbil the Otter - Study Notes': '## Gavin Maxwell and Mijbil\n- Gavin Maxwell, a writer in the Scottish West Highlands, was lonely after his dog Jonnie died.\n- He found an injured otter cub by the river, took it home and named it Mijbil, treating it with the care he had given his dog.\n- Mijbil recovered, learned to follow Maxwell and even took him fishing.\n\n## The Return of the Otter\n- Mijbil escaped one night and was never seen again.\n- Years later Maxwell heard of an otter in a place where otters were said to be extinct, and he travelled to see it - his friend was alive.\n- The story ends with a sense of mystery and lasting companionship.\n\n## First Person Narrative\n- The account is written in the first person with the author\'s own feelings, which makes the reader share his attachment to Mijbil.\n- The Scottish setting is described in detail: the river, the cottage, the rain and the cold.\n\n## Vocabulary of Animals and Nature\n- Useful words: **otter**, **cub**, **bipedal**, **nutria**, **trots**, **teased**, **peat**, **loch**, **reeds**.',
    'Madam Rides the Bus - Study Notes': '## Valli and Her First Bus Ride\n- Valliammai (Valli) is eight and lives in a village; she has no playmates and watches the street from her doorway.\n- She decides to travel by bus to the town, about ten miles away, to see the world for herself.\n\n## A Moment of Life and Death\n- On the way back the bus passes a place where a young woman is standing alone; the bus stops and she is taken away.\n- Valli does not understand it fully but realises that people die and that the world outside her village is full of both joy and sorrow.\n\n## Descriptive Language\n- The bus ride is described through what Valli sees: the bright green fields, the rivers, the roadside shops and the marketplace.\n- The contrast between the colourful journey and the quiet sadness at the end gives the story its force.\n\n## Words of Travel and Places\n- Useful words: **conductor**, **fare**, **platform**, **whistle**, **rattle**, **hiss**, **destination**, **marketplace**, **township**, **wonder**.',
    'The Sermon at Benares - Study Notes': '## Gautama Buddha and Human Sorrows\n- Prince Siddhartha Gautama met a sick man, an aged man and a funeral procession while hunting and was deeply moved by human suffering.\n- He left his royal life, wandered for seven years and meditated under a peepal tree until he attained enlightenment.\n\n## The Sermon at Benares\n- Buddha taught at Sarnath on the day of the full moon, and the first sermon was on the Four Noble Truths.\n- He taught that sorrow is the cause of unhappiness, that the removal of craving brings peace, and that the Eightfold Path is the way.\n- The crowd at Benares was moved and worshipped the Buddha for the first time.\n\n## Sermon as a Form of Speech\n- A **sermon** is a talk on a religious or moral subject; it can also be used lightly, as in "my mother\'s sermon about homework".\n- A sermon aims to change behaviour, not only to inform.\n\n## Vocabulary from the Text\n- **Afflicted with** (suffering from), **be composed of** (made up of), **desolation** (a state of utter loneliness), **lamentation** (an expression of sorrow), **procure** (get), **be subject to** (suffer from), **enlightenment** (the state of being free from ignorance).',
    'The Proposal - Study Notes': '## R, G and the Proposal\n- R and G are colleagues; R asks his manager for a raise and is asked to work at the office until eight.\n- R writes a letter to G proposing marriage, but the letters cross; each thinks the other is the proposer.\n- In the end both agree to marry, and R\'s uncle reacts with typical exaggeration.\n- The play is a satire on the conventions of proposing and on the characters\' vanity.\n\n## A Russian Wedding\n- A Russian wedding lasts two days; the bride\'s and groom\'s families share the expenses.\n- The groom must climb the stairs of the apartment and answer a riddle at every landing before he can reach the bride.\n\n## Humour and Verbal Comedy\n- The comedy comes from repetition: the same phrase used again and again, and from the reversal of who is proposing.\n- The narrator\'s stage directions and the exaggerated characters create the comic effect.\n\n## Formal Letter Writing\n- Parts of a formal letter: the sender\'s address and date, the receiver\'s address, the subject line, a polite opening, the body, a polite closing and the signature.\n- A formal request uses "I am writing to request..." and ends with "Yours sincerely".',
  
  'Exploring the Investigative World of Science - Study Notes': '## Exploring the Investigative World of Science (Chapter 1)\n\n### The big idea\nGrade 8 science is about **investigating**, not only about learning facts. The chapter asks: how do scientists turn a simple curiosity into a fair test and a clear explanation? The journey of the book runs from microbes and body health, through electricity and forces, to matter, light, the sky and finally Earth itself.\n\n### The puri investigation (a model experiment)\n- **Ask a scientific question**: why does a puri puff up, and why is one side thinner than the other?\n- **What you can change (control)**: the thickness and size of the rolled dough, the type of flour (atta, maida), the temperature of the oil, and how the dough is dropped into the oil (vertically, at an angle, slowly).\n- **What you can observe (measure)**: does the puri puff up (yes/no)? How many seconds does it take? Does the oil splatter, smoke or smell?\n- Change **only one thing at a time** and keep everything else the same — same circles of dough, same way of dropping them.\n- Keep written notes of everything you see and sense; every round of an experiment raises fresh questions (does stored dough puff better? what if the puri is pricked before frying?).\n\n### What to remember\n- A scientific investigation = careful observation + a thoughtful experiment + a clear explanation.\n- The variable you change is the **independent** variable; the conditions you keep the same are **controlled** variables.\n- Even the everyday puffing of a puri is not fully understood by scientists — real science keeps its questions open.',
  'The Invisible Living World: Beyond Our Naked Eye - Study Notes': '## The Invisible Living World: Beyond Our Naked Eye (Chapter 2)\n\n### Seeing the unseen\n- The human eye can only see objects above a certain size. **Lenses** — a piece of glass shaped like a lentil seed — began as simple magnifiers and grew into microscopes.\n- **Robert Hooke** (1665, *Micrographia*) saw empty compartments in cork with his microscope and named them **cells** — the first use of the word in science. His microscope magnified 200–300 times.\n- **Antonie van Leeuwenhoek** (1660s) built better lenses, was the first to see and describe bacteria and blood cells, and is called the **Father of Microbiology**.\n\n### The cell and its parts\n- **Cell membrane** — encloses the cytoplasm and nucleus, separates one cell from another; porous, so materials enter and wastes leave.\n- **Cytoplasm** — holds carbohydrates, proteins, fats and mineral salts; most life processes happen here.\n- **Nucleus** — regulates all activity in the cell and controls growth.\n- **Cell wall** (only in plant cells) — gives rigidity and strength.\n- **Plastids** — rod-like structures; **chloroplasts** contain chlorophyll and make photosynthesis possible; **vacuoles** store substances, remove waste and keep the cell’s shape (large in plants, tiny in animals).\n- Cell shape matches function: muscle cells are spindle-shaped, nerve cells long and branched, cheek cells thin and flat.\n\n### Levels of organisation and microbes\nCell → Tissue → Organ → Organ system → Organism. A living being that starts as a single cell which divides repeatedly is **multicellular**.\n- **Microorganisms** (protozoa, algae, fungi, bacteria) live in water, soil, air and inside us. **Viruses** are acellular and multiply only inside a living cell.\n- Fungi and bacteria break down plant waste into nutrient-rich **manure**; microbes in our gut help digestion.',
  'Health: The Ultimate Treasure - Study Notes': '## Health: The Ultimate Treasure (Chapter 3)\n\n### What health really means\nThe WHO defines health as “a **state of complete physical, mental, and social well-being**, and not merely the absence of disease.” Ayurveda teaches the same balance of body, mind and surroundings, through *dinacharya* (daily routine) and *ritucharya* (seasonal routine).\n- **Signs** can be seen or measured (fever, rash, high blood pressure, swelling); **symptoms** are what we feel (pain, tiredness, dizziness).\n\n### Staying healthy\n- Balanced diet with fruits, vegetables and whole grains; avoid processed, fatty or sugary food.\n- Stay active, limit screen time, sleep well, practise yoga or pranayama.\n- Keep the environment clean — clean air and water matter, and the **AQI** tells us how clean the air is.\n- Strong relationships and a positive mindset are part of health too.\n\n### Diseases\n- **Communicable diseases** are caused by **pathogens** (bacteria, viruses, fungi, worms, protozoa) and spread by air, food, water, direct or indirect contact, or **vectors** such as mosquitoes and houseflies — typhoid, dengue, flu, chickenpox, COVID-19.\n- **Non-communicable diseases** (cancer, diabetes, asthma) are not caused by pathogens and are linked to lifestyle, diet and environment; most deaths in India today come from NCDs.\n\n### Immunity, vaccines and antibiotics\n- **Immunity** is the body’s natural ability to fight disease; the **immune system** does the fighting.\n- **Vaccines** train the immune system to recognise a pathogen — giving **acquired immunity**. Jenner’s cowpox work led to the first vaccine; India’s traditional **variolation** (teekedaars) preceded it. Vaccines prevent, they do not cure.\n- **Antibiotics** (discovered: penicillin, 1928, by Fleming) kill bacteria only — not viruses or protozoa. Taking them when not needed, or not completing the dose, breeds **antibiotic resistance**.',
  'Electricity: Magnetic and Heating Effects - Study Notes': '## Electricity: Magnetic and Heating Effects (Chapter 4)\n\n### Current and magnetism are linked\n- In 1820 **Hans Christian Oersted** noticed that a compass needle deflects whenever a circuit is closed or opened. A current-carrying wire therefore produces a **magnetic field** around itself — the **magnetic effect of electric current**. The effect vanishes as soon as the current stops.\n- A current-carrying coil that behaves like a magnet is an **electromagnet**. It has a North and a South pole, and the poles can be **reversed by reversing the current**.\n- Strength of an electromagnet increases with more current (more cells) and with **more turns** of the coil; an **iron core** makes it stronger still.\n- **Lifting electromagnets** hang from cranes in factories and scrap yards: switch the current ON and the iron/steel is lifted, switch it OFF and it is released.\n- Earth’s own magnetic field comes from the movement of liquid iron in the core; it guides migratory animals and shields life from space particles.\n\n### Heating effect\n- Current flowing through a conductor meets **resistance**; some electrical energy becomes heat. This is the **heating effect of electric current**.\n- **Nichrome wire** is used in heaters because it has a high resistance, so it produces more heat for the same current. More cells means more current and more heat.\n\n### Cells and batteries\n- A **Voltaic cell** uses chemical reactions: two metal electrodes (e.g. zinc and copper) in an **electrolyte** (lemon juice or salt solution works — a lemon cell can light an LED).\n- A **dry cell** has a zinc container (negative) and a carbon rod (positive) with a moist paste electrolyte; it is single-use.\n- **Rechargeable batteries** (lithium-ion is most common) can be reused many times, and solid-state batteries are the next step.',
  'Exploring Forces - Study Notes': '## Exploring Forces (Chapter 5)\n\n### What a force is\n- A **force** is a push or a pull on an object, resulting from its **interaction with another object**. At least two objects must interact for a force to come into play.\n- The SI unit of force is the **newton (N)**.\n- A force can: make an object move from rest, change its speed, change the direction of motion, change the shape of an object — or do several of these at once.\n\n### Contact forces\n- **Muscular force** comes from contracting and elongating muscles while walking, lifting, pushing or chewing; it also circulates the blood and pushes food down the alimentary canal.\n- **Friction** is the force that appears when an object moves or tries to move over another surface. It always acts **opposite to the motion**, and it arises from the tiny irregularities of the two surfaces locking into each other. It is greater on rough surfaces and also acts in liquids and gases (streamlined ships and aeroplanes).\n\n### Non-contact forces\n- **Magnetic force** — a magnet attracts magnetic material and repels like poles, without touching.\n- **Electrostatic force** — rubbing objects builds up **static charges**; a charged object attracts uncharged ones, and two similarly charged balloons repel while a charged balloon and the cloth it was rubbed with attract.\n\n### Weight, mass and upthrust\n- **Mass** is the amount of matter (g or kg) and stays the same everywhere. **Weight** is the gravitational force with which Earth pulls an object (N) and changes from place to place — 1 kg weighs 10 N on Earth but 1.6 N on the Moon.\n- A liquid pushes an object upward with the **upthrust (buoyant force)**. By **Archimedes’ Principle**, the upthrust equals the weight of the liquid displaced: if the displaced liquid weighs less, the object sinks; if it weighs the same, it floats.',
  'Pressure, Winds, Storms, and Cyclones - Study Notes': '## Pressure, Winds, Storms, and Cyclones (Chapter 6)\n\n### Pressure\n- **Pressure = Force ÷ Area**. The SI unit is **newton/metre²**, called a **pascal (Pa)**. The practical unit of air pressure is the millibar (1 mb = 100 Pa); it is also written in hectopascal.\n- A smaller area means a larger pressure: driving a nail by its point, cutting with a sharp edge, carrying a load with a broad strap, lifting a bucket with a broad handle, and putting a round cloth under a head-carried load — all reduce pressure by increasing the area.\n- Liquids exert pressure on the **bottom** and on the **sides** of a container — in all directions. The pressure depends on the **height of the liquid column**, which is why water tanks are placed high (more pressure at the taps) and why dams have a broader base.\n- Air exerts pressure too: the **atmospheric pressure** pushes on every object and grows with the area covered (the inverted paper-plate activity). A balloon inflates because the air inside pushes out in all directions.\n\n### Wind, storms and cyclones\n- Air moves from a **high-pressure region to a low-pressure region**; this explains sea breeze (day) and land breeze (night).\n- **High-speed winds are accompanied by reduced pressure** — blowing between two balloons makes them come together. That is why roofs are blown away in storms, and why keeping doors and windows open during a storm reduces the pressure difference.\n- In a **thunderstorm**, warm moist air rises, cools and condenses; strong updrafts and downdrafts rub droplets and ice, charging the clouds. **Lightning** is the sudden flow of charge when air stops insulating; **thunder** is the air heated by that flash. A lightning conductor gives charges a safe path into the ground.\n- A **cyclone** forms over warm ocean water: rising moist air, released heat, ever-lower pressure, and the Earth’s rotation spinning the system. The calm centre is the **eye**; the cyclone weakens once it reaches land.',
  'Particulate Nature of Matter - Study Notes': '## Particulate Nature of Matter (Chapter 7)\n\n### Matter is made of tiny particles\n- Break a stick of chalk again and again and grind it: eventually you reach grains that cannot be broken further. These are the **constituent particles** of the substance. Sugar behaves the same way — its particles cannot be seen in the solution, but their presence is sensed by taste.\n- Acharya Kanad of ancient India first proposed the idea of indivisible eternal particles called **Parmanu** in the *Vaisheshika Sutras*.\n- When sugar dissolves, its particles occupy the **interparticle spaces** between water particles.\n- Particles are held together by attractive **interparticle attractions**. The strength of these forces decides the state of the substance — and it drops sharply if the distance increases even slightly.\n\n### The three states\n- **Solid** — particles tightly packed, very strong attractions: definite shape and volume; particles only vibrate about their fixed positions. On heating, vibrations grow until particles leave their positions: the solid melts at its **melting point** (ice 0 °C, urea 133 °C, iron 1538 °C).\n- **Liquid** — particles are somewhat farther apart and move freely but stay close together: no fixed shape (it takes the shape of the container) but definite volume. On heating it boils at its **boiling point** and the particles escape into the vapour state.\n- **Gas** — particles are farthest apart, attractions weakest, moving freely in all directions: no fixed shape and no fixed volume.\n\n### Remember\n- Melting and boiling happen at a definite temperature at atmospheric pressure.\n- Density falls from solid to liquid to gas, so a solid usually sinks in its own liquid.',
  'Nature of Matter: Elements, Compounds, and Mixtures - Study Notes': '## Nature of Matter: Elements, Compounds, and Mixtures (Chapter 8)\n\n### Mixtures\n- Two or more substances mixed so that each **retains its own properties** form a **mixture**; the substances are its **components** and do not react chemically.\n- **Non-uniform mixtures** (sprout salad, poha) have components visible to the naked eye or a magnifier. **Uniform mixtures** (sugar in water) have evenly distributed components that cannot be distinguished even with a microscope.\n- **Air** is a uniform mixture of nitrogen (about 78 %), oxygen, argon, carbon dioxide and water vapour. Lime water turning milky shows the carbon dioxide in the air (calcium hydroxide + carbon dioxide → calcium carbonate + water). Dust particles in air are pollutants, and the **AQI** describes air quality.\n- Mixtures are named by the states of their components: gas–gas, gas–liquid, solid–gas, liquid–liquid, solid–liquid, solid–solid. **Alloys** (stainless steel, brass, bronze) are solid–solid mixtures; ancient India knew **Mishraloha**.\n\n### Pure substances\n- A **pure substance** consists of only one type of particle and cannot be separated into other kinds of matter by any physical process. Water, when frozen or boiled, remains water.\n- Passing electricity through water splits it into **hydrogen** (pop sound) and **oxygen** (flame glows brighter).\n\n### Elements and compounds\n- An **element** cannot be broken down into simpler substances: it is made of identical atoms (gold, silver, sulfur, carbon). Atoms of most elements join to form **molecules** (two hydrogen atoms → one molecule of hydrogen). 118 elements are known; eleven are gases at room temperature and only mercury and bromine are liquids.\n- A **compound** is formed when different elements combine in a **fixed ratio** to make something entirely new, and its elements **cannot be separated by physical means**. Water has hydrogen and oxygen in the ratio 2:1; sodium chloride has sodium and chlorine in 1:1 (a soft metal plus a hazardous gas becomes harmless common salt).\n- Heating sugar leaves charcoal (carbon) and water droplets — so sugar is a compound of carbon, hydrogen and oxygen.',
  'The Amazing World of Solutes, Solvents, and Solutions - Study Notes': '## The Amazing World of Solutes, Solvents, and Solutions (Chapter 9)\n\n### Solute, solvent, solution\n- A **uniform mixture** of a solid in a liquid is a **solution**. The solid is the **solute**, the liquid is the **solvent**.\n- For a mixture of two liquids, the substance present in smaller amount is the solute and the one in larger amount is the solvent.\n- A solution in which more solute can still dissolve is **unsaturated**; when the solute stops dissolving and settles down it is **saturated** at that temperature. The amount of solute in a fixed quantity of solution is the **concentration** — a **dilute** or a **concentrated** solution (relative terms).\n- The maximum amount of solute that dissolves in a fixed quantity of solvent is its **solubility**.\n\n### Effect of temperature\n- For most substances the solubility **increases with temperature**: water at 70 °C dissolves more baking soda than at 50 °C, and a saturated solution becomes unsaturated when it is heated.\n- The solubility of **gases decreases** as temperature rises — cold water holds more oxygen, which is why aquatic life thrives in cold water.\n\n### Density, floating and sinking\n- **Density = Mass ÷ Volume**; it does not depend on the shape or size of the object but does depend on temperature and pressure (pressure matters mainly for gases).\n- A substance floats in a liquid when it is less dense than that liquid; a denser one sinks. Density is therefore not the only factor — the upthrust and the weight must be compared.\n\n### Remember\n- Chalk, sand or sawdust mixed with water gives a **non-uniform** mixture; sugar and salt give a uniform one.\n- A uniform mixture keeps every sip of homemade ORS tasting the same.',
  'Light: Mirrors and Lenses - Study Notes': '## Light: Mirrors and Lenses (Chapter 10)\n\n### Spherical mirrors\n- A **spherical mirror** is part of a hollow sphere, made by grinding and polishing flat glass. A reflecting surface curved **inwards** is a **concave mirror**; curved **outwards** is a **convex mirror**.\n- In a **concave mirror**, a close object gives an erect, enlarged image; moved further away the image becomes inverted and then keeps shrinking. A **convex mirror** always gives an erect, diminished image, and shows a much wider area of the road behind.\n- Uses: concave — torch and headlight reflectors, dental mirrors, telescope mirrors; convex — vehicle side-view mirrors (hence “objects in mirror are closer than they appear”), road-curve safety mirrors, surveillance mirrors in shops.\n- All three types of mirror show **lateral inversion**.\n\n### Laws of reflection\n- The ray that falls on the mirror is the **incident ray**; the ray that comes back is the **reflected ray**; the line at 90° to the mirror at the point of incidence is the **normal**.\n- **Law 1:** angle of incidence (i) = angle of reflection (r). **Law 2:** the incident ray, the normal and the reflected ray all lie in the same plane.\n- The reflected beam is visible only on the same side of the mirror as the incident beam — that is why a beam cannot be seen when the paper behind the mirror is folded away.\n\n### Lenses\n- A **lens** is transparent material with curved surfaces. A lens thicker in the middle is a **convex lens**; thicker at the edges, a **concave lens**.\n- A convex lens converges a light beam (a **converging lens**) — it can focus sun rays and burn paper; a concave lens diverges it (a **diverging lens**).\n- Through a convex lens the object looks erect and enlarged when close, then inverted and smaller as it moves away; through a concave lens it always looks erect and diminished.\n- Lenses are used in eyeglasses, cameras, telescopes and microscopes — and the eye itself contains a convex lens that can change its shape.',
  'Keeping Time with the Skies - Study Notes': '## Keeping Time with the Skies (Chapter 11)\n\n### The changing Moon\n- The Moon does not emit light; it **reflects sunlight**. Only one half of the Moon always faces the Earth, and that half is not always the illuminated half — so the shape we see changes.\n- The changing shapes of the bright portion are the **phases of the Moon**. The bright part shrinking from full circle to half circle and vanishing over about two weeks is the **waning period** (**Krishna Paksha**); the growing period is the **waxing period** (**Shukla Paksha**). The full circle is **Purnima**, the invisible night is **Amavasya**.\n- More than half of the lit portion visible = **gibbous**; less than half = **crescent**.\n- A waxing Moon is easiest to spot at sunset, a waning Moon at sunrise, and the moonrise is about 50 minutes later each day. On any single day people all over the Earth see nearly the same phase.\n\n### Calendars from the sky\n- The **solar day** (about 24 hours) is measured by the Sun’s return to its highest point; the **month** (~29.5 days) by the cycle of Moon phases; the **year** (~365¼ days) by the Earth’s revolution and the cycle of seasons.\n- **Lunar calendars** use the Moon’s phases (month ≈ 29.5 days, year = 12 lunar months = 354 days) but drift away from the seasons.\n- **Solar calendars** (the Gregorian calendar) keep the year in step with the seasons and correct the extra quarter day with a **leap year** — a leap day every four years, skipped every 100 years and added back every 400 years.\n- **Luni-solar calendars** count days by the Moon and add an **Adhika Maasa** (intercalary month) when the months fall short of the solar year; the **Indian National Calendar** is such a calendar.\n- Uttarayan and Dakshinayan, the solstices and the equinoxes were tracked in ancient India from the stars rising at sunset.',
  'How Nature Works in Harmony - Study Notes': '## How Nature Works in Harmony (Chapter 12)\n\n### Habitats and their components\n- A **habitat** is a place where an organism lives — even the bark of a tree is one. Every habitat has **biotic components** (plants, animals, microorganisms) and **abiotic components** (air, water, soil, sunlight, temperature).\n- A **population** is a group of organisms of the same kind in a habitat at a given time; a **community** is all the different populations sharing the habitat; biotic and abiotic components together form an **ecosystem**.\n- A habitat with only one kind of organism leads to competition and scarcity of food, water and space.\n\n### Interactions\n- Interactions fall into three kinds: between **abiotic and biotic** components (earthworms in moist soil), between **two abiotic** components (sunlight heating the day), and **among biotic** components (a frog eating insects, a fish laying eggs in water).\n- A pond study shows the chain: fish eat dragonfly larvae → fewer dragonflies → more bees and butterflies → better pollination → more seeds.\n- **Food chains and food webs** show who eats whom; energy and matter move from producers to consumers and decomposers.\n- **Waste in nature**: decomposers (fungi, bacteria) break down dead matter and return nutrients to the soil; one change leads to another (the butterfly effect of a single link).\n- **Human-made ecosystems** (farms, gardens, ponds) show that healthy ecosystems serve agriculture too — good soil, pollinators and water.\n- **Wildlife corridors** connect forest habitats so animals such as elephants can move safely between them without conflict with people.',
  'Our Home: Earth, a Unique Life Sustaining Planet - Study Notes': '## Our Home: Earth, a Unique Life Sustaining Planet (Chapter 13)\n\n### Why Earth is special\n- All known life lives on a very thin **crust** — if Earth were an apple, the crust would be as thin as its skin. Earth is the only planet where life, as we know it, thrives.\n- The solar system has eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The inner four are small and rocky; the outer four are large and mostly gaseous. **Venus is the hottest planet** because its thick carbon-dioxide atmosphere traps heat — the **greenhouse effect**.\n- Earth’s **position** is right: the **habitable (Goldilocks) zone** is the range of distances where water stays liquid. Closer, water boils away; farther, it freezes.\n- Earth’s **size** lets it hold an atmosphere — a smaller world would lose its gases; a much larger one would crush us under its gravity. Oxygen in the atmosphere becomes the **ozone layer**, which blocks harmful UV rays.\n- Earth’s **magnetic field**, probably from the movement of molten iron in the core, deflects cosmic rays and the solar wind and keeps the atmosphere safe.\n\n### What sustains life\n- Life depends on connections between living and non-living things: **air, water and sunlight**, **soil, rocks and minerals**, and **plants, animals and microorganisms** — the balance between them matters.\n- Life persists through **reproduction**: **asexual** reproduction (one parent, e.g. binary fission in bacteria) and **sexual** reproduction (two parents, giving variation).\n\n### Threats\n- Human activities change the climate, disturb the balance of nature, and put species at risk — which is why science must be used to protect the delicate balance on which life depends.',
  'A Square and A Cube - Study Notes': '## A Square and A Cube (Chapter 1)\n\n### Square numbers\n- A number that can be written as a number multiplied by itself is a **square number**: (1^2 = 1), (2^2 = 4), (3^2 = 9), (4^2 = 16), (5^2 = 25). The squares of natural numbers are called **perfect squares**.\n- Squares of fractions and decimals work the same way: ((3/5)^2 = 9/25), ((2.5)^2 = 6.25).\n- **Patterns to remember**\n  - A square never ends in 2, 3, 7 or 8; it can end only in 0, 1, 4, 5, 6 or 9.\n  - A number ending in 1 or 9 has a square ending in 1; a number ending in 5 has a square ending in 25.\n  - A number with three zeros at the end has a square with six zeros at the end — so a square can have only an **even** number of trailing zeros.\n  - The sum of the first n odd numbers is (n^2): (1 + 3 + 5 + 7 = 16).\n- **Locker puzzle**: a locker is toggled once for each of its factors, so it stays open only if the number of factors is odd. Factors come in pairs, except when a number is a square — so the open lockers are exactly the **square numbers**. Lockers toggled exactly twice are the **prime numbers** (code 2-3-5-7-11).\n\n### Cubic numbers\n- Numbers obtained by multiplying a number by itself three times are **perfect cubes**: (1^3 = 1), (2^3 = 8), (3^3 = 27), (4^3 = 64), (5^3 = 125).\n- A cube of side 4 holds (4 	imes 4 	imes 4 = 64) unit cubes; cubes can never end in exactly two zeros.\n- The **cube root** of (y) is written (sqrt[3]{y}): (sqrt[3]{27} = 3), (sqrt[3]{1000} = 10).\n- The sum of consecutive odd numbers also builds cubes: (3 + 5 = 8 = 2^3), (7 + 9 + 11 = 27 = 3^3).\n- **Taxicab numbers**: 1729 (the Hardy–Ramanujan number) is the smallest number expressible as a sum of two cubes in two different ways — (1729 = 1^3 + 12^3 = 9^3 + 10^3). The next are 4104 and 13832.',
  'Power Play - Study Notes': '## Power Play (Chapter 2)\n\n### Exponential notation\n- Folding a sheet of paper 46 times makes it thicker than 7,00,000 km: the thickness multiplies by 2 at every fold. This repeated multiplication is written with an **exponent**: (n^a) means (n) multiplied by itself (a) times. In (5^4 = 625), 4 is the **exponent** and 5 is the **base**.\n- In exponential form a product of primes becomes compact: (32400 = 2^4 	imes 5^2 	imes 3^4).\n\n### Laws of exponents\n- (n^a 	imes n^b = n^{a+b}). So (4^6 	imes 4^3 = 4^9).\n- ((n^a)^b = (n^b)^a = n^{ab}). So (8^6 = (8^2)^3 = 8^3 	imes 8^3), and (2^{10} = (2^2)^5 = (2^5)^2).\n\n### Zero and negative exponents\n- (x^a div x^a = x^{a-a} = x^0 = 1) for (x \neq 0).\n- Halving a line of length (2^4) five times gives (2^4 div 2^5 = 2^{-1} = 1/2). In general (n^{-a} = 1/n^a), so (10^{-3} = 1/1000).\n\n### Powers of 10 and scientific notation\n- Expanded form uses powers of 10: (47561 = (4 	imes 10^4) + (7 	imes 10^3) + (5 	imes 10^2) + (6 	imes 10^1) + 1).\n- Any number can be written as (x 	imes 10^y) with (1 leq x < 10). This is the **scientific (standard) form**: (5900 = 5.9 	imes 10^3), (20800 = 2.08 	imes 10^4), (80,00,000 = 8 	imes 10^6). It makes very large or very small numbers easy to read and compare.',
  'A Story of Numbers - Study Notes': '## A Story of Numbers (Chapter 3)\n\n### Why we count\nHumans have counted since the Stone Age — to know the quantity of food and animals, to record trade and rituals, and to track the new moon, full moon and the onset of seasons. A **number system** is a standard, ordered sequence of objects, names or written symbols; counting is a **one-to-one mapping** between the collection and that sequence.\n\n### Early systems\n- **Tally marks** — sticks or notches on bone (the Ishango bone, 20,000–35,000 years old, and the Lebombo bone with 29 notches).\n- **Counting in groups** — the Gumulgal counted in twos, so 3 = 2 + 1, 4 = 2 + 2, and anything above 6 was called *ras*. The idea of counting in 2s, 5s, 10s or 20s is a step forward from tallying.\n- **Roman numerals** — a sequence of **landmark numbers** I, V, X, L, C, D, M (1, 5, 10, 50, 100, 500, 1000) added up, e.g. (2367 = MMCCCLXII). They represent numbers well but make arithmetic such as multiplication very awkward.\n\n### The idea of a base\n- If each landmark number is obtained by multiplying the previous one by a fixed number (n), the system is a **base-(n) number system**; the landmark numbers are the powers of (n): (n^0 = 1, n, n^2, n^3, dots). The Egyptian system is base 10; a system built on 5 is base 5.\n- Because the landmark numbers are powers of one number, the product of two landmark numbers is itself a landmark number — which makes multiplication easy. The Roman system cannot do this.\n\n### Our own system\n- The digits 0–9 and the place-value idea originated in India: the **Bakhshali manuscript** (3rd century CE) shows the earliest use of ten digits including 0; **Aryabhata** (c. 499 CE) first used the system for scientific computation. It travelled to the Arab world (Al-Khwārizmī), then to Europe, where it is still called the *Arabic numerals*. The **abacus**, built on powers of 10, was used for calculation for centuries.',
  'Quadrilaterals - Study Notes': '## Quadrilaterals (Chapter 4)\n\n### Rectangles and squares\n- A **rectangle** is a quadrilateral with four right angles (90°) and equal opposite sides.\n- By SAS and AAS congruence: the **diagonals of a rectangle are equal** and **bisect each other** at their midpoints. This is why a carpenter needs the second strip of wood to be exactly as long as the first, and joined at the same point.\n- A **square** is a rectangle with all four sides equal; its diagonals are equal, perpendicular and bisect each other.\n\n### Angles of a quadrilateral\n- The sum of the four angles of any quadrilateral is (360^circ). In a rectangle each angle is (90^circ), and the diagonals split it into eight equal parts.\n\n### More quadrilaterals\n- A **parallelogram** has both pairs of opposite sides parallel; opposite sides are equal, opposite angles are equal and the diagonals bisect each other.\n- A **rhombus** is a parallelogram with all sides equal; its diagonals bisect each other at right angles and cut it into four congruent right triangles.\n- A **kite** has two pairs of adjacent equal sides; one diagonal bisects the other at right angles and cuts the kite into two congruent triangles.\n- A **trapezium** has one pair of opposite sides parallel. When the non-parallel sides are equal it is an **isosceles trapezium**, whose base angles and diagonals are equal.\n- A square is a special rectangle, a special rhombus, a special parallelogram and a special kite — a good reminder that the classes overlap.',
  'Number Play - Study Notes': '## Number Play (Chapter 5)\n\n### Parity and consecutive numbers\n- Place ‘+’ and ‘–’ signs between four consecutive numbers: all eight expressions give an **even** number, because switching one sign always changes the value by (2b) (an even number), so all expressions share the same parity.\n- 7 = 3 + 4 = 4 + 5 + 6; 12 = 3 + 4 + 5; 15 = 7 + 8; 10 = 1 + 2 + 3 + 4 — every odd number can be written as a sum of two consecutive numbers.\n\n### Multiples, factors and remainders\n- A number is a **multiple** of another if it is that number times a whole number; a number that divides another exactly is a **factor**.\n- Useful facts: if (a) divides (m) and (n), then (a) divides (m+n) and (m-n); if (A) is divisible by (k), all multiples of (A) are divisible by (k); if (A) is divisible by both (k) and (m), it is divisible by their **LCM**.\n- A number that leaves remainder 3 when divided by 5 has the form (5k + 3); a number leaving remainder 2 when divided by both 3 and 4 is of the form (12n + 2).\n\n### Divisibility shortcuts\n- A number is divisible by **9** if and only if the sum of its digits is divisible by 9 (each place value is one more than a multiple of 9). Add the digits repeatedly to get the remainder.\n- The same idea gives divisibility by **3** (digit sum divisible by 3) and by **11**: add the digits in the odd places and the digits in the even places and subtract; if the difference is 0 or a multiple of 11, the number is divisible by 11.\n- **Digits in disguise**: rearranging digits does not change the digit sum, so a number can often be proved a multiple of 9 without doing any division.',
  'We Distribute, Yet Things Multiply - Study Notes': '## We Distribute, Yet Things Multiply (Chapter 6)\n\n### The distributive property\n- (a(b + c) = ab + ac) and ((a + b)c = ac + bc) — the **distributive property of multiplication over addition**. It can be drawn as an area model: a rows by b columns of cells, plus a rows by c columns.\n- Because of it, the increase in a product can be found without multiplying everything out.\n\n### How a product changes\n- Increasing one number by 1: (a(b+1) = ab + a) — the product grows by (a).\n- Increasing **both** numbers by 1: ((a+1)(b+1) = ab + a + b + 1), so the product increases by (a + b + 1).\n- Increasing one number by 1 and decreasing the other by 1: ((a+1)(b-1) = ab + b - a - 1).\n- In general ((a+m)(b+n) = ab + mb + an + mn) — the increase is (an + bm + mn).\n- These equalities, which hold for **all** values of the letter-numbers, are called **identities**.\n\n### Special cases and careful errors\n- Special cases of distribution: (a 	imes 0 = 0), (a 	imes 1 = a), and ((a - b) 	imes c = ac - bc).\n- Common mistakes: distributing a sum over a multiplier in the wrong order, dropping a term while expanding, or cancelling a term wrongly when a minus sign is involved.\n- **This way or that way**: the same product can be found in different orders — the order of multiplication does not change the result, and distributive expansions can be done in whichever order is simplest. The chapter also shows why working with letter-numbers (not just numbers) is what proves a rule for every case.',
  'Proportional Reasoning-1 - Study Notes': '## Proportional Reasoning-1 (Chapter 7)\n\n### Similarity in change\n- Two images look the same when their width and height change by the **same factor**. A picture whose width is reduced by 20 mm and height by 20 mm is distorted, because the height changed by a factor and the width only by a difference. Changes like this are **proportional**.\n\n### Ratios\n- A **ratio** compares two quantities: for image A the ratio of width to height is (60 : 40). The two numbers are the **terms** of the ratio.\n- Reduce a ratio to its **simplest form** by dividing both terms by their **HCF**: (60 : 40 = 3 : 2), (90 : 60 = 3 : 2), while (40 : 20 = 2 : 1) and (60 : 60 = 1 : 1).\n- Two ratios are **in proportion** when their simplest forms are the same; we write (a : b :: c : d).\n\n### Problem solving with proportional reasoning\n- Model the situation as (6 : 10 :: 18 : ?) and find the factor of change (18 ÷ 6 = 3), then apply it to the second term: 10 becomes 30.\n- In the wall example, 60 ft with 3 bags and 40 ft with 2 bags both give 20 : 1, so both walls are equally strong.\n- **Sharing, but not equally**: when parts are shared unequally, the ratio tells you how to split.\n- **Unit conversions** are proportional too: if 1 cm on a map stands for some distance, scale every measurement by the same factor.',
  'Fractions in Disguise - Study Notes': '## Fractions in Disguise (Chapter 1, Part II)\n\n### Percentages are fractions in disguise\n- ‘Per cent’ comes from the Latin *per centum* — “by the hundred”. So (25%) means 25 out of every 100, and a percentage is simply a fraction whose denominator is 100.\n- To express a fraction as a percentage, find the equivalent fraction with denominator 100: (3/4 = 75/100 = 75%), (2/5 = 40%).\n- To convert back, (24% = 24/100 = 12/50 = 6/25).\n- Why 100? It is a round number that fits the decimal system — (31% = 0.31) — and it is the sweet spot between too small (per 10) and too large (per 1,00,000).\n\n### The FDP trio\n- **Fraction → Decimal → Percentage** are three names for the same quantity: (50% = 50/100 = 1/2 = 0.5).\n- Useful mental maths: 20% of a value is double 10% of it; (20% + 5%) of a value is 25% of it; 75% = 50% + 25%.\n\n### Percentage of a quantity\n- 80% of 75 marks = 60 marks — the same answer comes from the fraction method, the decimal method and proportional reasoning.\n- A ratio converts to a percentage: millet and water in 2 : 7 means millet is (2/9 approx 22.22%) of the mixture, so 500 ml of the mixture needs about 111 ml of millet.\n- A cyclist who has covered 40% (92 km) has 138 km left, because the whole journey is 230 km.\n\n### Percentages in daily life\n- **Percentage increase or decrease** = change ÷ original amount × 100.\n- **Cost price, marked price and selling price** give profit or loss: profit % = profit ÷ cost price × 100; a 35% discount on an MRP of ₹1,800 means a selling price of ₹1,170.',
  'The Baudhayana-Pythagoras Theorem - Study Notes': '## The Baudhayana-Pythagoras Theorem (Chapter 2, Part II)\n\n### Doubling and halving a square\n- In the *Śulba-Sūtra* (c. 800 BCE) **Baudhayana** asked: how can a square of double the area be built? Doubling each side gives **four** times the area, so that is not the answer. His construction: **the diagonal of a square produces a square of double the area** — the original square is two small triangles, the new square is four, all congruent.\n- **Halving a square** reverses the construction: a tilted square drawn inside the larger one (with the creases through the midpoints of the sides) has exactly half the area.\n\n### The hypotenuse of an isosceles right triangle\n- The side opposite the right angle is the **hypotenuse**. For an isosceles right triangle with legs of 1 unit, the square on the hypotenuse has area 2, so (c^2 = 2) and (c = sqrt{2}).\n- (sqrt{2}) has a **non-terminating decimal expansion** ((1.4142ldots)) and **cannot be written as a fraction** (m/n): if it could, then (2n^2 = m^2), but in the prime factorisation of a square every prime occurs an even number of times, and here 2 occurs an odd number of times on the left — impossible.\n\n### The theorem\n- By marking a rectangle of sides (a) and (b) and building a square on the hypotenuse, the pieces rearrange so that the square on the hypotenuse has exactly the area of the two smaller squares:\n  **Baudhayana’s Theorem on right-angled triangles: if a right-angled triangle has side lengths (a), (b) and (c), with (c) the hypotenuse, then (a^2 + b^2 = c^2).**\n- This is the famous **Pythagorean theorem**, stated by Baudhayana first and in this modern form.\n- Integer-sided right triangles exist (3, 4, 5), but no right triangle with square sides exists — an open problem that became **Fermat’s Last Theorem**, proved in 1994.\n- Applications: finding the shortest path on the surface of a cuboid, heights of a ladder against a wall, and the diagonals of rectangles.',
  'Proportional Reasoning-2 - Study Notes': '## Proportional Reasoning-2 (Chapter 3, Part II)\n\n### A quick recap\n- Two ratios (a : b) and (c : d) are proportional if (a 	imes d = b 	imes c), or (a/c = b/d). Cross-multiplication is the quickest check.\n\n### Ratios in maps\n- A **Representative Fraction (RF)** shows the ratio between a distance on the map and the actual distance on the ground: RF (1 : 60,00,000) means 1 cm on the map is 60,00,000 cm — that is 60 km — on the ground.\n- With a ruler and the scale you can find the geographical distance between two places, and the answer stays the same whichever map you use, as long as you respect the scale.\n- Sketches of a classroom or a village are made with a stated scale, e.g. 1 : 50.\n\n### Ratios with more than two terms\n- A ratio may have any number of terms: coriander : chilli : dal : methi = 8 : 4 : 2 : 1. The terms of proportional ratios change by the same factor: (8 : 4 : 2 : 1 :: 4 : 2 : 1 : 0.5).\n- Work out the value of one part first (if 5 parts = 10 litres, 1 part = 2 litres), then multiply every other term by it.\n- **Dividing a whole in a given ratio**: add the terms, divide the whole by that sum and multiply each term by the quotient. 110 units of concrete in the ratio 1 : 1.5 : 3 needs 20, 30 and 60 units.\n\n### Inverse proportions\n- In an **inverse proportion**, when one quantity increases, the other decreases so that their product stays the same — e.g. if the time taken halves, the speed doubles for the same distance.',
  'Exploring Some Geometric Themes - Study Notes': '## Exploring Some Geometric Themes (Chapter 4, Part II)\n\n### Fractals\n- A **fractal** is a self-similar shape: the same pattern appears again and again at smaller and smaller scales. Ferns, trees, clouds, coastlines, mountains and lightning are all natural fractals.\n- **Sierpinski Carpet**: divide a square into 9, remove the central one and repeat on the 8 that remain. The number of squares left at step (n) is (R_n = 8^n), and the number of holes satisfies (H_{n+1} = H_n + R_n).\n- **Sierpinski Triangle (Gasket)**: join the midpoints of an equilateral triangle, remove the middle triangle and repeat on the 3 left.\n- **Koch Snowflake**: start with an equilateral triangle, divide each side into 3, raise an equilateral triangle on the middle third and remove that middle part; repeat on every new side.\n- Fractals appear in Indian art too — the Kandariya Mahadev Temple at Khajuraho (c. 1025 CE) and the diamond patterns of Nigerian Fulani wedding blankets — and in the work of M. C. Escher.\n\n### Visualising solids\n- The **net** of a solid can be folded into it, and unfolding a cuboid in different ways gives different straight-line paths; the **shortest path** for an ant and a laddu on a cuboid is found by unfolding and applying the Baudhayana-Pythagoras theorem.\n- **Projections**: the projection of a point P on a plane M is the point O where the perpendicular from P meets the plane. The projections of all points give the projection of the object — a hole made by a passing object has that shape.\n- A projection does not identify an object uniquely, so three mutually perpendicular projections are used: **front view** (vertical plane), **top view** (horizontal plane) and **side view** (side plane).',
  'Tales by Dots and Lines - Study Notes': '## Tales by Dots and Lines (Chapter 5, Part II)\n\n### The mean as a balance point\n- The **mean** (average) of some data is the sum of the values divided by the number of values; the **median** is the middle value of the sorted data.\n- On a dot plot the mean is the **balance point**: the total distance of the values to the left of the mean equals the total distance to the right. It is the only such centre — moving it either way unbalances the data.\n- Including a value **greater** than the mean pulls the mean up; including a smaller one pulls it down; adding or removing a value equal to the mean leaves it unchanged. Two values on one side and one on the other can also leave the mean unchanged.\n- **Relatively unchanged**: adding or subtracting the same number from every value shifts the mean by exactly that number; multiplying every value by (k) multiplies the mean by (k). Proved with algebra.\n- The **median** behaves differently: adding a value greater than the median raises it (it becomes the average of the two middle values), adding a smaller one lowers it.\n- The mean can also be used backwards: if the average weight of 10 players is 39.2 kg and nine weights are known, the missing one is found from sum ÷ number.\n\n### Reading data visually\n- **Line graphs** are best for change over time: the steeper the line, the greater the change; a flat line means no change. Compare Punjab’s and Kerala’s monthly maximum temperatures, or the number of objects launched into space each year.\n- **Infographics** communicate a comparison quickly — a map of rice versus wheat preference, for instance.\n- Always ask: how was the data gathered, what does the scale show, and which conclusions are valid inferences?',
  'Algebra Play - Study Notes': '## Algebra Play (Chapter 6, Part II)\n\n### ‘Think of a number’ tricks\n- Every trick can be explained by algebra. Double a number (x), add 4, halve it and subtract the original: (2x + 4 = 2(x + 2)), then (x + 2 - x = 2), whatever number you start with.\n- The **date trick**: multiply the month by 5, add 6, multiply by 4, add 9, multiply by 5, add the day. Algebra gives (100M + 165 + D), so subtracting 165 leaves a number whose last two digits are the day and whose first digits are the month.\n\n### Number pyramids\n- In a pyramid each number is the sum of the two numbers below it. With letters in the bottom row the top can be found without building the whole pyramid: for three rows the top is (a + 2b + c).\n- Missing entries can be recovered by writing the equations and solving them, e.g. ((12 + c) + (c + 8) = 60) gives (c = 20).\n- With the **Virahanka-Fibonacci** numbers in the bottom row, the pyramid fills with Fibonacci numbers and the top is the next term.\n\n### Grids, products and divisibility\n- **Calendar magic**: in a 2 × 2 block of a calendar the four numbers add up to (4a + 16), so the sum alone identifies the block.\n- **The largest product**: to maximise the product of two numbers built from three digits, use the largest digit as the multiplier and arrange the other two in decreasing order — proved by comparing the expanded products.\n- **Decoding divisibility tricks**: reversing the digits of a two-digit number and taking the difference always gives a multiple of 9, because (10a + b - (10b + a) = 9(a-b)).',
  'Area - Study Notes': '## Area (Chapter 7, Part II)\n\n### Measuring area\n- Area is measured by counting the **unit squares** that fit inside a region, so the area of a rectangle is **length × width** (7 cm × 4 cm = 28 cm²). A diagonal cuts a rectangle into two congruent triangles, so each triangle is half the area: (1/2 	imes 7 	imes 4 = 14) cm².\n- **Perimeter is not a measure of area**: two regions can have the same perimeter but very different areas, and a region with a larger perimeter can have a smaller area.\n\n### Area of a triangle\n- Joining the midpoints of the sides of a triangle gives four congruent small triangles; the area of the triangle is **half of base × height**, which also gives the **area of any polygon** by adding the areas of the triangles it can be split into.\n\n### Special formulae by dissection\n- Cutting a figure into pieces and rearranging them into a different figure of the same area is called **dissection**.\n- **Parallelogram**: cut off a triangle and move it to the other side to make a rectangle — so **area = base × height**. Any side can be taken as the base with its corresponding height.\n- **Rhombus**: as a parallelogram it has area base × height, but its diagonals give a second formula — **area = 1/2 × d₁ × d₂**, because the diagonals cut it into four congruent right triangles.\n- **Trapezium**: cut it into two triangles, or use **area = 1/2 × (sum of parallel sides) × height**.\n- Keep the base and the height separate — the height is the perpendicular distance, not a slanted side.',
  'Wit and Wisdom - Study Notes': '## Wit and Wisdom (Unit 1, Poorvi)\n\n### The three pieces in the unit\n- **“The Wit that Won Hearts”** — a story set in the Vijayanagara Empire. King Krishnadeva Raya (ruled 1509–29 CE) was a wise and powerful monarch whose reign is called the Golden Era. His court held eight celebrated poets, the **Ashtadiggajas**, including Tenali Ramakrishna, known for quick wit and humour. When the king quarrels with the queen, Thirumalambal, over a poem she found insulting, Tenali Rama steps in.\n- His **strategy**: he presents the king with a claim that the new paddy seeds will give three times the yield, and then proves the real issue is “the person who sows them”, not the seeds. He plants the seeds himself, harvests a bumper crop and the quarrel ends — wit, not confrontation, settles it.\n- **“A Concrete Example” by Reginald Arkell** — a poem that uses **irony and satire**. A rock garden, a lily pond, a crazy path and a sundial with a strange device may be a delight to one visitor and nothing at all to another: what is beautiful depends on the eye that sees.\n- **“Wisdom Paves the Way”** — a play in which four advisers with different strengths set out to guide a king who is angry and mistrustful. Each proposes a different solution; the audience weighs the character of each adviser.\n\n### Language work\n- **Modals**: the present modal (can, may, might, should) for possibility, permission and advice, and the past modal (would, could, might) for a hypothetical or imagined situation, plus the pattern *Past Perfect + would*. Modals always need a helping verb.\n- **Writing**: a **narrative essay** is organised around a personal experience — a title, a sequence of events, a personal reflection and a conclusion.\n- **Glossary**: words like *renowned, illustrious, eminent, patron, insurmountable, trivial, forlorn, distracted, strategy* — the story’s own key words.',
  'Values and Dispositions - Study Notes': '## Values and Dispositions (Unit 2, Poorvi)\n\n### The three pieces in the unit\n- **“A Tale of Valour: Major Somnath Sharma and the Battle of Badgam”** — on 5 July 1999, during the Kargil War, Major Somnath Sharma of the 8th Battalion led a counter-attack to retake the strategically vital point known as **Point 4875** in the **Battle of Badgam**. Although he was hit by a grenade, he kept leading his men, and was posthumously awarded the **Param Vir Chakra**, India’s highest military honour for gallantry in the presence of the enemy.\n- **“Somebody’s Mother” by Mary Dow Brine** — a poem. An old woman is left uncared for in a crowded street; a passing young man gives her water and food. The last line, “And ‘somebody’s mother’ bowed low her head”, turns the phrase into a title for every ordinary person who needs care: small acts of kindness and empathy carry great comfort.\n- **“Verghese Kurien – I Too Had a Dream”** — the story of the man who made milk available to every Indian. Kurien left his home in Kerala, studied dairy science in the United States and returned to build the dairy co-operative movement — Operation Flood made India the world’s largest producer of milk. He says plainly that personal awards mean little unless you also contribute to the common good, and that work must be done with honesty and confidence.\n\n### Language work\n- **Subject–verb agreement**: the verb must agree with its subject in number — *he runs*, *they run*, *the number of students is*, *the boys are*.\n- **Punctuation**: the **en dash (–)** for a span or range (pages 50–75, June–September, a score of 2–1); the **em dash (—)** to add extra information or show a change of thought.\n- **Possessives**: *its* (belongs to it) vs *it’s* (it is); *their* vs *they’re*; *your* vs *you’re*.\n- **Prepositional phrases** begin with a preposition and a noun or pronoun, and give extra information about time, place, manner, cause, direction or relationship.',
  'Mystery and Magic - Study Notes': '## Mystery and Magic (Unit 3, Poorvi)\n\n### The three pieces in the unit\n- **“The Case of the Fifth Word” by Donald J. Sobol** — Chief Brown receives a note with four odd words and a request: “Suppose you could read this and you know what it means. What is the fifth word?” The note was torn from a calendar page, and the four words — *Nom, Utes, Sweden, Hurts* — are the names of countries with letters missing: **Denmark** without the fifth letter! The solver also learns from *The Encyclopedia’s Head* that the fourth word on the page was the word “September”, so the five words are together: September, Denmark, Norway, Sweden, **Finland**. Careful attention to detail and a link with the library solved the mystery.\n- **“The Magic Brush of Dreams”** — a folk tale in which a poor painter is given a magic brush that paints whatever he imagines: a plough for one farmer, a shawl for a grandmother, a fan for a girl, a fort, a horse, a feast. But the brush obeys the painter’s *character*, and when greed enters, the brush stops working. The moral: **talent used for good, not for display, is what gives it value**.\n- **“Spectacular Wonders”** — a tour of India’s mysterious natural phenomena: the Valley of Flowers with around 600 exotic species, the **Living Root Bridges** of Meghalaya grown from living fig roots, **Magnetic Hills** where gravity seems to pull vehicles uphill, **Glowing Waters** caused by bioluminescence, the **Sundarbans** mangrove forest (1,400 km, Bengal tiger, estuarine crocodile, Indian python) and the **Chandipur Beach** in Odisha where the sea retreats 2–5 km at ebb tide and returns at high tide.\n\n### Language work\n- **Reported speech**: changing direct speech into indirect speech needs the reporting verb, the right tense (a past action becomes past progressive or past modal), the correct pronoun and the necessary punctuation.\n- **Gerunds**: a verb used as a noun (-ing form), e.g. *reading*, *solving*.\n- New vocabulary: *mystique, enigmatic, intrigue, ebb tide, estuarine, bioluminescence, eco-tourism, mangrove*.',
  'Environment - Study Notes': '## Environment (Unit 4, Poorvi)\n\n### The three pieces in the unit\n- **“The Cherry Tree” by Ruskin Bond** — Rakesh and his little sister find a cherry tree in the garden and try to grow it. A storm splits the tree in two; one half is cut away. Rakesh waters what is left, guards it from goats, and the stump sends up tender green shoots until it is taller than he is — and it bears fruit. The story teaches patience, perseverance and the rewards of caring for nature: a half-chewed cherry is the sweetest one.\n- **“Harvest Hymn” by Sarojini Naidu** — a song of gratitude to the farmer, the plough, the soil and the rain. The harvest is a sacred occasion: the earth gives, the farmer labours, and the people celebrate together. It celebrates the **agricultural cycle** and our dependence on the land.\n- **“Waiting for the Rain” by Kamakshi Balasubramanian** — a village waits for the monsoon; when the rain finally comes the sowing begins. The story captures the **vagaries of nature**, the farmer’s faith, and the wisdom of understanding renewal and balance. It connects with the **Chipko Movement**, in which villagers hugged trees to protect them, and with how crop–weather knowledge can raise production.\n\n### Language work\n- **Determiners**: *a, an, the, some, any, several, few, many, much* — *several* means more than two but not many; *few* means a small number.\n- **Adjectives formed from proper nouns**: Indian, American, Japanese; and adjectives from common nouns (careful, kind, brave).\n- **Syllables and ‘beats’**: a syllable can be called a beat, which is the base of metre in poetry.\n- **Punctuation and capitalisation**: *‘Harvest Hymn’* and *Our Home* — the letter ‘h’ in ‘Home’ is capitalised inside a title.',
  'Science and Curiosity - Study Notes': '## Science and Curiosity (Unit 5, Poorvi)\n\n### The three pieces in the unit\n- **“Feathered Friend” by Arthur C. Clarke** — a bird is carried into an orbiting space station and becomes the companion of an astronaut who is far from home. The story imagines **companionship beyond human relationships**: the bird is a friend, a comfort and a reminder of Earth while the crew works in weightlessness, with the station’s hidden places, storage bulkheads and the constant tangle of floating objects.\n- **“Magnifying Glass” by Walter de la Mare** — a poem that plays with perception: the myriad shells, the forest of flowers and trees, a drop of water, the silly flies — what the eye reports and what the mind adds are not the same. Curiosity begins with looking more closely.\n- **“Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science”** — Bibha Chowdhuri (born in pre-independent India) went to the University of Manchester in 1945 under the celebrated Nobel Laureate **Patrick M. S. Blackett**, where her Ph.D. on **cosmic rays** made her news as “India’s New Woman Scientist”. She became the **first woman faculty member at TIFR**, was **nominated for a Nobel Prize by Erwin Schrödinger**, and had a chair professorship declared in her name. The International Astronomical Union renamed the star **HD 86081** in the constellation Leo as **‘Bibha’**. Her legacy is the beacon — the “beam of light” — for today’s women in ISRO and STEM.\n\n### Language work\n- **Future forms**: the simple future for future actions, ‘shall/will’ for arrangements and predictions, and the future continuous for work in progress at a future time.\n- **Word formation**: adding **-ment** and **-hood** (achieve + ment = achievement; child + hood = childhood) and keeping the front part of a word (exam → examination, ad → advertisement).\n- **Active and passive voice**: *A cure for the disease was discovered* (passive) versus *The team discovered a cure* (active).\n- **Pronunciation**: silent letters, as in *alarm* (uh-laam), *psychologist* (sai-ko-luh-juhst).',

  'How Forces Affect Motion - Study Notes': '## Force and How We Measure It\n- A **force** is a physical quantity: it needs a magnitude, a direction and a unit. The SI unit of force is the **newton (N)**.\n- A force can start an object moving, change its speed or direction, and even change its shape (squeezing a lemon).\n- A **spring balance** measures the magnitude of a force. The **weight** of an object is the gravitational force with which the Earth pulls it.\n- The **force of friction** acts on an object in the direction **opposite to its motion**. It depends on the nature of the two surfaces and on how hard they are pressed together, and it acts even when the object is at rest.\n\n## Balanced and Unbalanced Forces\n- When the **net force** on an object is zero, the forces are **balanced**: the object stays at rest or moves with constant velocity.\n- An **unbalanced (net) force** changes the speed or the direction of motion - it accelerates the object.\n- On a smooth, frictionless surface an object keeps moving even with no force applied; in everyday life it is friction that stops it.\n\n## Newton\'s Three Laws\n- **First law (law of inertia):** an object at rest remains at rest, and an object in motion continues to move with a constant velocity, unless a net force acts upon the object.\n- **Second law:** when a net force acts on an object, the object accelerates in the direction of the net force; the acceleration is proportional to the net force and inversely proportional to the mass. **F = ma**. One newton is the force that gives a mass of 1 kg an acceleration of 1 m s-2.\n- **Third law:** whenever one object exerts a force on a second object, the second object simultaneously exerts an equal and opposite force on the first. Action and reaction act on *different* bodies, so they never cancel each other.\n- For a system of connected objects the forces between them are internal; only the net external force decides how the system moves.',
  'Work, Energy, and Simple Machines - Study Notes': '## Work Done by a Force\n- **Work** is done when a force **displaces** an object in the direction of the force: **W = F x s** (s = displacement along the force).\n- The SI unit of work is the **joule (J)**; 1 J = 1 N x 1 m.\n- Work done is **zero** if the force is zero (F = 0) or if there is no displacement (s = 0), for example when you push a rigid wall.\n- Work is **positive** when force and displacement are in the same direction and **negative** when they are in opposite directions.\n\n## Energy, Power and Machines\n- **Energy** is the capacity to do work. It takes many forms - electrical, thermal, light, chemical and mechanical - and changes from one form into another.\n- **Work-energy theorem:** the work done on an object or system equals the change in its energy.\n- **Kinetic energy** (energy of motion): **KE = 1/2 mv^2**. **Potential energy** (energy of position or deformation): **PE = mgh**.\n- **Mechanical energy** = kinetic energy + potential energy; in free fall (no air resistance) it stays the same.\n- **Power** is the rate of doing work: **P = W / t**; 1 watt = 1 joule per second.\n- **Simple machines** - pulley, inclined plane and lever - make a task easier by changing the magnitude or direction of the effort, but they never reduce the total work.\n- **Mechanical advantage = load / effort**. A fixed pulley has MA = 1 (it only changes direction); a movable pulley, an inclined plane (MA = length / height) and a lever (effort x effort arm = load x load arm) all give an MA greater than 1.',
  'Journey Inside the Atom - Study Notes': '## Models of the Atom\n- Long ago **Acharya Kanada** in India and **Leucippus and Democritus** in Greece argued that matter is made of tiny indivisible particles.\n- **Thomson\'s model (1897):** the atom is a sphere of positive charge with electrons embedded in it - the *plum pudding* model.\n- **Rutherford\'s gold foil experiment (1911):** most alpha particles passed straight through, some were deflected and a few bounced back. Conclusion: the atom is mostly empty space, with all the mass and positive charge in a tiny, dense **nucleus**.\n- **Bohr\'s model (1913):** electrons do not move randomly but revolve in fixed circular paths (orbits or shells) of definite energy, so they do not fall into the nucleus.\n\n## Atomic Number, Mass Number and Shells\n- **Atomic number (Z)** = number of protons in the nucleus; it fixes the identity and the chemical behaviour of an element.\n- **Mass number (A)** = protons + neutrons, called **nucleons**. As a proton and a neutron have nearly equal mass, A is about the mass of the atom in atomic mass units.\n- The **neutron** was discovered by **James Chadwick (1932)**; it is neutral, has nearly the mass of a proton, and is present in every nucleus except hydrogen.\n- Maximum electrons in a shell = **2n^2**, so K shell (n = 1) holds 2, L shell (n = 2) holds 8 and M shell (n = 3) holds 18 electrons; the outermost shell can hold at most 8.\n- The distribution of electrons in the shells is the **electronic configuration**. **Valency** is the combining capacity of an atom, measured by the number of H or Cl atoms it combines with.\n\n## Isotopes and Isobars\n- **Isotopes:** same atomic number but different mass numbers - for example H-1, H-2 and H-3.\n- **Isobars:** different atomic numbers but the same mass number - for example Ar-40, K-40 and Ca-40.',
  'Atomic Foundations of Matter - Study Notes': '## Two Laws and Atomic Theory\n- **Law of conservation of mass** (Lavoisier, 1789): matter can neither be created nor destroyed in a chemical reaction - the total mass before equals the total mass after.\n- **Law of constant proportions** (Proust): in a compound, elements combine in a fixed ratio by mass, whatever its source (water is always hydrogen and oxygen in the ratio 1 : 8 by mass).\n- **Dalton\'s atomic theory:** all matter is made of tiny indivisible atoms; atoms of an element are identical in mass and properties; atoms of different elements combine in fixed whole-number ratios to form compounds; in a reaction atoms are only rearranged.\n\n## Bonds, Formulae and Masses\n- A **molecule** is the smallest particle of an element or a compound that keeps its identity.\n- **Covalent bond:** atoms **share** electron pairs (H2, H2O, CH4). The **molecular mass** is the sum of the atomic masses of all the atoms in the molecule (H2O = 2 x 1 + 16 = 18 u).\n- **Ionic bond:** atoms **transfer** electrons - a metal loses them and becomes a cation, a non-metal gains them and becomes an anion (NaCl, MgO). The simplest whole-number ratio of ions is a **formula unit**, and its mass is the **formula unit mass** (Na2O = 2 x 23 + 16 = 62 u).\n- Writing formulae: cross over the **valencies** (covalent compounds) or the **charges** (ionic compounds, cation first, anion second).\n- Ionic compounds are usually solids, dissolve in water and conduct electricity in solution or when molten; covalent compounds are generally liquids or gases, poor conductors and often soluble in organic solvents.',
  'Sound Waves: Characteristics and Applications - Study Notes': '## Production and Propagation of Sound\n- Sound is produced by **vibrating** objects. A **tuning fork** - a U-shaped bar of steel or aluminium - is the standard instrument used for experiments.\n- Sound needs a **material medium**: in the vacuum bell jar experiment the sound fades as air is pumped out. Sound travels fastest through solids, then liquids, then gases.\n- In a sound wave the particles of the medium oscillate to and fro about their mean position while the wave carries the energy forward. Sound is therefore a **longitudinal** wave of compressions and rarefactions.\n\n## Characteristics of a Sound Wave\n- **Wavelength (lambda):** distance between two consecutive crests or two consecutive troughs.\n- **Frequency (f):** number of oscillations per second, in hertz. **Time period T = 1 / f**.\n- **Speed of sound:** v = distance / time, and **v = f x lambda**. In dry air it is about **331 m s-1 at 0 degrees C** and nearly **344 m s-1 at 22 degrees C**; it also depends on humidity.\n- **Amplitude** is the maximum change in density of the medium in a compression or rarefaction. A larger amplitude means a **louder** sound; **pitch** depends on frequency - a higher frequency gives a shriller sound.\n- Human hearing roughly spans **20 Hz to 20 kHz**.\n\n## Reflection and Applications\n- Sound follows the law of reflection: the angle of incidence equals the angle of reflection.\n- **Echo** is the reflected sound heard after a gap of at least 0.1 s; the reflecting surface must be at least 17.2 m away.\n- **Reverberation** is the persistence of sound after several reflections within 0.05 s; auditoriums use soft, rough surfaces to control it.\n- **Ultrasound** (above 20 kHz) and **infrasound** (below 20 Hz) are used in medicine, industry and nature - for example detecting earthquakes and cleaning machines.\n- **Echolocation:** bats and dolphins judge the distance, direction and size of objects from the echo of their ultrasonic calls.',
  'Reproduction: How Life Continues - Study Notes': '## Asexual Reproduction\n- **Asexual reproduction** involves a single parent and produces genetically identical offspring; it is seen in bacteria, amoeba, yeast, hydra, sponge and many plants.\n- Methods include **binary fission** (amoeba), **budding** (yeast, hydra), **fragmentation** (spirogyra), **spore formation** (ferns, bread mould) and **regeneration** (planaria).\n- **Vegetative propagation** - cutting, grafting, layering and tissue culture - keeps the desirable characters of a plant, which is why it matters in agriculture.\n\n## Sexual Reproduction and Variation\n- Sexual reproduction needs **two parents**, both contributing genetic material, so gametes are formed by **meiosis**, which halves the chromosome number (in humans 46 becomes 23) and creates variation.\n- In **flowering plants**, **pollination** is the transfer of pollen to the stigma - self-pollination within the same flower or plant, cross-pollination between plants, brought about by wind, water, insects or birds.\n- After **fertilisation** the male gamete fuses with the egg in the ovule; the zygote develops into an embryo and the ovule into a seed.\n- In animals the gametes must meet: in frogs and most fish they are released into water, in many land animals they are transferred directly.\n\n## Human Reproduction and Reproductive Health\n- **Gametogenesis** forms the gametes - sperm in the **testes** (inside the scrotum) and eggs in the **ovaries**; one mature egg is released each month (**ovulation**).\n- Fertilisation happens in the oviduct; the embryo implants in the uterine lining. If the egg is not fertilised, the lining is shed as **menstruation**.\n- Pregnancy lasts about nine months in three **trimesters**; the mother needs a balanced diet, regular check-ups, light exercise and emotional well-being.\n- Reproductive maturity (puberty) is physical, but emotional and social maturity take longer - responsible choices protect against unwanted pregnancies and infections.',
  'Patterns in Life: Diversity and Classification - Study Notes': '## Biodiversity and the Need for Classification\n- **Biodiversity** is the variety of all living organisms. India is a **biodiversity hotspot**: mountains, deserts, rainforests, plateaus and long coastlines each carry their own species.\n- Small differences between individuals affect their chances of survival and reproduction; accumulated over generations they give rise to new forms of life - **evolution**.\n- **Fossils**, the preserved remains of plants and animals in layers of rock, sand and mud, are the evidence: older layers hold simpler organisms, newer layers more complex forms.\n- Classification is the library of biology. It groups millions of species using external features, mode of nutrition, body organisation, cellular structure, behaviour and, for animals, the presence of a backbone.\n\n## Systems of Classification\n- Aristotle (4th century BCE) grouped animals by their **habitat** - land, water and air - and by external appearance; the two-kingdom system then split life into Plantae and Animalia, and Haeckel and Copeland added further kingdoms.\n- **Carolus Linnaeus** gave the two-part naming system, and **Robert H. Whittaker (1969)** proposed the **five-kingdom** classification - Monera, Protista, Fungi, Plantae and Animalia.\n- **Protista** - unicellular eukaryotes; **Fungi** - multicellular heterotrophs with chitin walls and a mycelium, mostly saprophytes; **Plantae** - multicellular autotrophs with cellulose walls; **Animalia** - multicellular heterotrophs that move and respond quickly to stimuli.\n- Classification is **hierarchical**: Kingdom, Phylum, Class, Order, Family, Genus, Species - each lower group shares more features and is part of the group above it.\n- **Binomial nomenclature** (Linnaeus): genus name + species epithet, for example *Panthera leo* - one universal name for every language.\n- Human activity - pollution, deforestation, overuse of resources and climate change - is reducing biodiversity; every species matters because plants give food and oxygen, animals pollinate and disperse seeds, and microbes recycle nutrients.',
  'Earth as a System: Energy, Matter, and Life - Study Notes': '## Uneven Heating of the Earth\n- **Solar radiation** - electromagnetic waves from the Sun - is the main source of energy on the Earth. It reaches the surface through the **atmosphere**, which is held in place by gravity and is made of about 78 % nitrogen and 21 % oxygen.\n- Different materials heat up differently: land heats faster than water, and dark surfaces absorb more sunlight than light-coloured ones.\n- The Earth is spherical, so solar rays fall steeply on the equatorial region but spread over a larger area near the poles - the equator is hot, the poles cold.\n- The atmosphere also keeps the surface warm at night and moves heat from one region to another.\n\n## Winds and Ocean Currents\n- **Wind** is the movement of air from a region of high pressure to a region of low pressure, and these pressure differences come from uneven heating.\n- **Local winds:** valley and mountain breezes in the hills, land and sea breezes near the coast.\n- **Planetary winds:** the equatorial low and the polar highs create belts of pressure that set air moving over long distances - polar, temperate and trade winds.\n- **Ocean currents** are the continuous movement of large masses of sea water, driven by the planetary winds and by differences in temperature and salinity.\n\n## Biogeochemical Cycles and Human Impact\n- **Water cycle:** evaporation, transpiration, condensation, precipitation, infiltration, groundwater and runoff.\n- **Carbon cycle:** carbon moves between the atmosphere (CO2), the biosphere (plants and animals), the geosphere (carbonate rocks and fossil fuels) and back.\n- **Nitrogen cycle:** atmospheric nitrogen is non-reactive, so **nitrogen fixation** converts it into soluble nitrates that plants take up; animals get nitrogen from plants, and **ammonification** and **denitrification** return it to the air and soil.\n- **Oxygen cycle:** oxygen is released by photosynthesis, used in respiration and combustion, and also exists combined in the Earth\'s crust.\n- Human use of fossil fuels raises CO2 levels, disturbs these cycles and causes climate change, extreme weather and biodiversity loss.',
  'I\'m Up and Down, and Round and Round - Study Notes': '## The Circle and Its Symmetry\n- A **circle** is the set of all points in a plane that lie at a given distance - the **radius** - from a fixed point, the **centre**.\n- A circle has **reflection symmetry** across any diameter and **rotational symmetry** about its centre through any angle.\n- A **chord** joins two points on the circle; a chord through the centre is a **diameter**; the curve between two points is an **arc**; the region bounded by an arc and the two radii is a **sector**; the part of the circle cut off by a chord is a **segment**.\n\n## Chords, Distance and Theorems\n- Infinitely many circles can be drawn through **two** points A and B; their centres lie on the **perpendicular bisector** of AB.\n- Through **three** points that are not on a straight line exactly one circle passes - the **circumcircle** of the triangle; its centre is the **circumcentre**, the intersection of the perpendicular bisectors.\n- **Equal chords subtend equal angles at the centre** of the circle, and conversely.\n- The line joining the centre to the midpoint of a chord is **perpendicular** to the chord; a perpendicular from the centre bisects the chord.\n- Chords of equal length lie at equal distances from the centre, and of two unequal chords the **longer chord is nearer the centre**.\n\n## Angles and Concyclic Points\n- The angle subtended by an arc at the **centre is twice** the angle it subtends at any point on the remaining part of the circle.\n- An angle subtended by a **diameter at any point on the circle is 90 degrees** - the angle in a semicircle.\n- If a segment AB subtends equal angles at two points C and D on the same side of AB, then all four points lie on one circle: they are **concyclic**.\n- A quadrilateral inscribed in a circle is **cyclic**, and in a cyclic quadrilateral the sum of each pair of opposite angles is **180 degrees**; conversely, a quadrilateral whose opposite angles add to 180 degrees is cyclic.',
  'Measuring Space: Perimeter and Area - Study Notes': '## Perimeter and the Value of pi\n- The **perimeter** of a shape is the total length of its boundary - a square of side a has perimeter 4a, an equilateral triangle of side a has 3a.\n- The ratio of the circumference to the diameter (**C/D ratio**) is the same for every circle. This constant is **pi**, approximately **22/7** or 3.14. Archimedes bounded it between 3 10/71 and 3 1/7, Aryabhata used 3.1416, Madhava gave the exact series pi = 4(1 - 1/3 + 1/5 - 1/7 + ...), and **pi is irrational**.\n- **Circumference** of a circle of radius r: **C = 2 pi r** (or pi d).\n- **Arc length** subtending a central angle theta degrees: **l = 2 pi r x theta/360**; a semicircle is pi r.\n\n## Area of Plane Figures\n- Area is the amount of space occupied by a region, measured in square units (a 1 x 1 square).\n- **Rectangle:** area = length x breadth. **Parallelogram:** area = base x height. **Triangle:** area = 1/2 x base x height.\n- **Heron\'s formula** gives the area from the three sides a, b, c: area = root of s(s - a)(s - b)(s - c), where s = (a + b + c)/2 - useful when the height is not known.\n- **Area of a circle: A = pi r^2**; the area of a **sector** of central angle theta degrees is **pi r^2 x theta/360**.\n- Baudhayana\'s construction in the Shulbasutra (800 BCE) shows how to \'square\' a rectangle, and Brahmagupta\'s formula gives the area of a cyclic quadrilateral from its four sides.',
  'The Mathematics of Maybe: Introduction to Probability - Study Notes': '## Probability: What It Means\n- **Probability** is a measurement of the likelihood of an event. It is expressed on a scale from **0 (impossible)** to **1 (certain)**, and written as P(E), where 0 <= P(E) <= 1.\n- **Randomness:** some outcomes cannot be predicted with certainty - a die roll or a coin toss. In a fair experiment every possible outcome is equally likely.\n\n## Two Ways of Measuring Probability\n- **Experimental probability** = number of times the event occurred / total number of trials. It depends on the number of trials and approaches the true value as trials increase.\n- **Theoretical probability** P(A) = number of favourable outcomes / number of possible outcomes. It assumes all outcomes of a fair situation are equally likely - which is why a cricket total of 6 and a total of 7 are not equally likely.\n- Statistical data can be analysed with probability to compare groups and draw conclusions about a population.\n\n## Sample Space, Events and Tree Diagrams\n- The **sample space** S = {outcome1, outcome2, ...} is the list of all possible outcomes of a random experiment.\n- An **event** is any single possible result, or a combination of results, from the sample space. The empty event has probability 0 and the whole sample space has probability 1.\n- A **tree diagram** lists and visualises all the possible outcomes of a random experiment, and makes it easy to compute the probability of an event - for example two coin tosses or two dice thrown together.',
  'Predicting What Comes Next: Exploring Sequences and Progressions - Study Notes': '## Sequences and Their Rules\n- A **sequence** is an ordered list of numbers, and each number in the list is a **term**.\n- An **explicit rule** gives the nth term directly from its position n, for example t(n) = 5n - 2. Because the position of a term is linked to its value, we can also ask whether a given number is a term of the sequence.\n- A **recursive rule** gives the value of a term using the values of the earlier terms - the rule must be applied step by step from the first term.\n- The **triangular number sequence** 1, 3, 6, 10, 15, ... is obtained by adding the natural numbers one by one, so its nth term is **t(n) = n(n + 1)/2**; this is also the formula for the **sum of the first n natural numbers** (the book derives it by writing the sum forwards and backwards and adding the two).\n\n## Arithmetic and Geometric Progressions\n- An **arithmetic progression (AP)** is a list in which every term after the first is obtained by adding a fixed number d, the **common difference**: a, a + d, a + 2d, a + 3d, ...\n- The nth term of an AP is **t(n) = a + (n - 1)d**, where a is the first term and d the common difference.\n- A **geometric progression (GP)** is a list in which every term after the first is obtained by multiplying the previous term by a fixed number r, the **common ratio**: a, ar, ar^2, ar^3, ...\n- The nth term of a GP is **t(n) = a r^(n-1)**.\n- Many **fractals**, such as the Sierpinski triangle and the Sierpinski square carpet, are built by repeating a shape inside itself, so the number of pieces grows as a geometric progression.',
  'How I Taught My Grandmother to Read - Study Notes': '## The Prose: Sudha Murty\n- The narrator, about twelve years old, stayed in a village in north Karnataka where the morning paper came only in the afternoon and the weekly magazine came a day late, so the whole family waited for the bus that carried them.\n- The Kannada writer **Triveni** was the family\'s favourite; her novel **Kashi Yatre** was appearing as a serial in the Kannada weekly *Karmaveera*. It is the story of an old lady who gives away all her savings so that an orphan girl can marry - and she says the orphan girl\'s happiness matters more than worshipping at Kashi.\n- Triveni died very young, yet forty years on people still read and appreciate her novels.\n- The grandmother **Krishtakka** never went to school, so the narrator read the serial aloud to her every Wednesday; the grandmother listened with ardent concentration and could later repeat the whole text by heart. She identified herself with the novel\'s old lady, who also never went to Kashi.\n- The grandmother explains that she lost her mother as a child, married young and was never sent to school, but she made sure that her children and grandchildren studied well. The story shows that **learning is possible at any age** and that literacy brings **independence and self-worth**.\n- Useful words: **ardent** (passionate), **savouring** (enjoying fully), **immensely** (very much), **aback** (shocked).\n\n## The Poem: Bharat Our Land (Subramania Bharati)\n- The poem is a tribute to India - its natural beauty, its spiritual and philosophical traditions, the Ganga, the Himavant, the Upanishads and the sages.\n- It closes with the call to recognise the enduring power of **knowledge and self-belief**: "she is peerless, let\'s praise her".\n- Appreciate the poem aloud for its **rhyme, rhythm and imagery**, and notice how the praise of the land turns into a call to effort.',
  'The Pot Maker - Study Notes': '## The Prose: Temsula Ao\n- **Sentila** dreams of becoming a pot maker like her mother **Arenla** and her grandmother, but Arenla wants her to become a weaver - pot making has brought her mother only a pittance for hard work.\n- Sentila learns the craft secretly from the expert potters, her father **Mesoba** among them; they are first amused by the little girl\'s insistence, and her visits to the work shed soon become village gossip.\n- She learns the whole process - shaping the clay with a **spatula**, drying the pots in the sun, loading them on a kiln of hay and dried bamboo and firing it, tending the fire so that the batch is neither over- nor under-fired. Soon her pots come within one of her mother\'s tally.\n- The **village council** summons Mesoba to answer for Arenla\'s refusal; the elders rule that pot making "did not belong to any individual" and that experts must pass the skill on to anyone who wishes to learn it.\n- On the day Arenla falls ill and dies while Sentila works, the girl leaves a row of finished pots behind; **Onula** later enters the work shed, sees two neat rows of pots and realises that one person alone made them all. Her quiet mastery is the story\'s climax.\n- The story is about **determination and skill**, the **dignity of a vocation** and the idea that craft belongs to the community.\n- Useful words: **outgrow**, **indifference**, **pittance**, **pounding**, **tedious**, **deftly**, **spatula**, **malleable**, **momentum**, **dexterity**, **threshold**.\n\n## The Poem: Gifts of Grace: Honouring Our Vocations (Anonymous)\n- The poem celebrates the potter, the shoemaker, the carpenter, the mason, the cook and the boatman: "The voice of their vocation is the voice of their identity."\n- Its message is the **dignity of labour** and the need to keep traditional crafts alive.\n- Notice the catalogue of vocations and the repeated use of the word *vocations* - the poem treats every honest craft as art.',
  'Winds of Change - Study Notes': '## The Prose: Gaatha.com (expository article)\n- The **punkha** (pankha) comes from the Sanskrit *pankh*, meaning the feather of a bird; *pankhi* was the small plumed fan of ancient India, seen in the 2nd-century CE **Ajanta** wall paintings and in embroidery, sculptures and carvings.\n- Pankhas were used in temples to fan the deities and in royal courts to fan kings; they ranged from a tiny two-inch fan to one needing a full arm\'s strength, travelled as traded cultural goods, and every village developed its own variety in its own materials.\n- Materials used include bamboo, cane, palm leaf, silk, brass, leather and silver, with beads and stones for decoration. **Rajasthan** has the applique fan (fabric pieces sewn on with ornamental needlework), the zardozi fan (encrusted gold threadwork) and temple fans of engraved brass with a long handle. **Gujarat** has cotton fans with mirror work, bead fans with silver handles and Kutch\'s hand-stitched leather fans. **Bengal** makes delicate fans from the milky-white sola, called *Tal Patar Pankha*. **Uttar Pradesh** has the Phadh fan of gold and silver zari, silk and satin frills.\n- Today pankhas are used mostly as decorative items and have become a **traditional craft** of India. The article is **expository**: it explains the craft, its materials, its regional variety and its place in our heritage.\n- Useful words: **encrusted** (decorated with), **sola**, **perpetually** (always), **antiquity** (great age), **advent** (arrival).\n\n## The Poem: Canvas of Soil (Maya Anthony)\n- The poet turns gardening into painting: each plot of soil is a **canvas**, seeds become brushstrokes, and the garden is a picture that is always new.\n- The poem moves from blossoms and morning light to the hands of those who till, showing that art is part of everyday life, customs and gardens.\n- Appreciate the imagery - "each plot, a canvas wide, where art and life coincide" - and the way the seasonal colours build the picture.',
  'Vitamin-M - Study Notes': '## The Prose: Asha Nehemiah\n- **Ravi** is left in charge of his grandfather for the day. Grandpa\'s habit is to give a gift to every child in the house on **his** birthday - and Ravi\'s own birthday is still three months away.\n- Ravi follows Grandpa secretly: to the corner shop for the Tamil newspaper, to the park (where he hides behind a bush trimmed like an elephant and is scolded by a lady and a small boy), to a tea stall, and finally on to a bus.\n- On the bus Ravi discovers that the man wearing Grandpa\'s yellow cap is a **total stranger**: at the barber\'s shop Grandpa had simply given him his cap because the day was hot. Ravi is frantic - the phone numbers of both his parents are busy - until he finds Grandpa at home, asleep and safe.\n- The last scene is the gift-wrapped parcel: a thick hardcover book, **The Best Detective Stories**, for Ravi.\n- The lesson is **caring for the elderly** with dignity: the grandfather gives, he does not receive, and he expects to be treated as an adult.\n- Useful words: **bustle**, **winced**, **jauntily**, **crouch**, **ducking**, **a volley of**, **deterred**, **confront**, **frantic**, **creases**, **darted**, **trailing**, **solemnly**.\n\n## The Poem: I Cannot Remember My Mother (Rabindranath Tagore)\n- The child says he **cannot remember his mother** - yet she returns in sensory memories: the smell of shiuli flowers, the scent of the morning service in the temple, the stillness of her gaze spreading over the sky.\n- The poem teaches that **presence and absence can coexist** - memory made of smell, sound and light keeps a mother alive.\n- Notice the repeated structure "I cannot remember my mother..." and how each stanza adds one more remembered sensation.',
  'The World of Limitless Possibilities - Study Notes': '## The Prose: An interview with Dr Deepa Malik\n- The unit opens with the history of the Paralympic Games (since 1968) and with para-archer **Sheetal Devi**, honoured with the Arjuna Award in January 2024, before moving to an **interview** with **Dr Deepa Malik**, a Khel Ratna, Arjuna and Padma Shri Awardee.\n- At 29 she was diagnosed with a **spine tumour**; after surgery the doctors said she would be paralysed waist down and bound to a wheelchair. She chose between "squander my life in remorse" and "transform it to a world of limitless possibilities".\n- A swimmer earlier, she switched to para-athletics and won the **silver medal in shot-put at the 2016 Rio Paralympics** - her breakthrough, and a step towards changing perceptions. She is India\'s first female Paralympic medallist and the first Indian female para-athlete to win an Asian Games medal in athletics.\n- Her message is **"ability beyond disability"**: physical limitations do not define one\'s potential, and advocacy for disability rights is integral to her mission.\n- Useful words: **resilience**, **locomotor**, **quell**, **indelible** (enduring), **squander** (waste), **remorse** (regret), **trailblazer**, **accolades**, **coveted**, **proponent**.\n\n## The Poem: Nine Gold Medals (David Roth)\n- Nine athletes with disabilities enter a race; one of them loses his shoe, and the others carry him so that he can run to the finish as well.\n- The crowd cheers the **nine** who finish together: the poem turns a race into a celebration of shared humanity.\n- Its message is **solidarity over competition**, and that inclusiveness is what real victory looks like.',
  'Twin Melodies - Study Notes': '## The Prose: A play by Mitra Phukan\n- The characters are **Shruti Sharma** (a young aspiring violinist), **Guru Nabin Sharma** (her father, a violinist and the Principal of Sangeetika Music School), **Leela Devi** (her mother), and the fusion band - **Avinash** on the tabla, **Iqbal** on the flute and **Peter** on the keyboard.\n- Act I opens with the fusion band rehearsing in Iqbal\'s room, with posters of flautists Pandit Hariprasad Chaurasia and Shashank Subramanyam on the wall. A newspaper piece praises Shruti\'s playing with her father, yet she wears a look of distress.\n- The conflict is **traditional against modern**: Nabin is contemptuous of fusion (\'phoo\' music) and refuses to let Shruti play in the Indo-western fusion concert next week; Shruti insists that without her the group cannot perform, and confesses that she joined without her father\'s knowledge.\n- The play is written with **stage directions, banter and irony**, and it makes the reader think about whether **tradition and innovation can be honoured together**.\n- Useful words: **crescendo** (music that grows louder), *bite the bullet*, *bring it up*, *come around*, *winding up*, *contempt*, *hubbub*, *iterated*.\n\n## The Poem: A Friend Found in Music (Bryanna T. Perkins)\n- The poet makes music a friend: "Music is the ocean that pulls me to the shore", "Music is the rhythm that moves me to the core", "Music is the therapy" and "the needed friend when no one seems to care".\n- The poem is written as a **diary of feelings** - the poet\'s comfort, cheer and strength come from music.\n- Appreciate the **repetition and the metaphor of the ocean**; the friend is dependable exactly when nobody else is there.',
  'Carrier of Words - Study Notes': '## The Prose: A documentary\n- The text follows **Khetaram**, a *Gramin Dak Sewak* and the **sole** postman of Somarad Branch Post Office. His left shoulder has slumped from years of carrying the mailbag, and for fifteen years he has been a trusted link between a Rajasthani village and its families.\n- His route lies at the far end of the **Thar** desert - about 120 km beyond the last railhead at Barmer, 50 km beyond the last phone, 10 km beyond where the road crumbles into sand too soft even for bicycles, right up to the dhaanis near the Indo-Pakistan border. The mail comes off the mail train onto buses and is then **hefted** onto his shoulders, and he delivers it within 24 hours of dispatch from Jodhpur, some 330 km away.\n- Gramin Dak Sewaks remain "the sole link between the oases of humanity in India\'s extremes and their faraway families" - letters, money orders, newspapers and news of a birth or a wedding travel with him, and a village offers a piece of jaggery for the news.\n- The prose shows how a service built on **words and trust** keeps people connected and sustains hope.\n- Useful words: **sole** (only), **hamlets** (small villages), **ply** (move regularly), **hefted** (lifted), **mojri** (a thick sandal), **riverine**, **inaccessible**, **remitted** (sent money), **scrap** (a small amount), **dwell** (live in).\n\n## The Poem: Words (Charles Swain)\n- The poet weighs words against the heart: words fail to satisfy the chest and "oft satisfy the least", like summer birds that sing their song and leave nothing behind; a flower that shows off cannot grow to the root.\n- Yet a few sincere words are "how dear" - the poem ends with the paradox that few, well-chosen words matter more than many empty ones.\n- Notice the images of **summer birds, gaudy flowers and roots**, and the rhyming couplets used for effect.',
  'Follow That Dream - Study Notes': '## The Prose: A letter by Irene Chua (from \'My Daughter, My Friend\')\n- The text is an **epistolary** piece - a letter dated 19 June 1995 from a mother to her teenage daughter **Ming**, taken from Irene Chua\'s collection *My Daughter, My Friend*.\n- The mother says: follow that dream; great men and women are great because they have a dream and pursue it till it comes true, and what makes them great is the **effort and sacrifice** they invest.\n- To reach world-class standard in any field one has to pursue the subject "singularly and intensively" for at least **ten years**: first a passion for the interest, then the conviction that it is imperative to realise it, then counting the cost in years, money and sacrifice - and if it still burns in your blood, **plunge**.\n- The road may be uphill, but you are buoyed up by the knowledge that you are doing what you love and doing the right thing; when stamina runs out, the prospect of success keeps you on track; and every winner thanks a **support network**.\n- The letter is a mother\'s advice, not a cage - it equips the daughter for "the challenges and realities of life".\n- Useful words: **insight**, **singularly** (exclusively), **imperative** (necessary), **plunge** (throw oneself into), **buoyed up** (kept afloat), **wistfully**, **dreamscape**, **enthusiasm**.\n\n## The Poem: Believe in Yourself (Robert Langley)\n- Four stanzas move from the fear of the future, to difficult choices, to leaving comfort behind, to taking the first step.\n- Its central message is **self-belief**: "The first step is the hardest / There is no turning back / You just need to believe in yourself / For your future to be on track."\n- Notice the **rhyme and rhythm** that make the lines easy to remember, and the advice form - imperatives that urge the reader to act.',
    'Exploration: Entering the World of Secondary Science - Study Notes': '## Entering the World of Secondary Science\n\n### Models: making sense of a complicated world\n- A **model** is a simplified way of looking at a real system. It keeps only what matters for the question being asked and ignores the rest on purpose.\n- In physics a moving car may be modelled as a single point; in chemistry atoms are drawn as spheres and bonds; in biology cells are shown as diagrams; in earth science the Earth may be treated as a smooth sphere.\n- Example: to model a cricket shot for a six, keep the mass of the ball and the speed and direction of the hit; ignore the brand of the bat, the colour of the ball, the grass on the field, the spin and the seam.\n- Modelling the falling of an object means neglecting air resistance; modelling how the heart pumps blood means ignoring individual cells.\n\n### The shared language of science\n- Everyday words such as force, work, cell and reaction have precise scientific meanings. Quantities carry a **symbol** and a **unit**: mass m, velocity v, force F, electric current I.\n- Using **standard SI units** everywhere avoids conversion errors (the passenger aircraft that ran out of fuel because kilograms were read as pounds).\n- **Mathematics** is a language, not a hurdle: an equation is a compact statement about how quantities are related.\n\n### Laws, theories, principles and predictions\n- A **law** describes a regular pattern observed in nature; a **theory** explains why the pattern occurs, based on evidence; a **principle** is a broad idea that makes sense of a situation.\n- A theory is not a guess - it is an explanation that is tested, challenged and revised.\n- Established science lets us **predict**: how far a kicked football will travel, how much carbon dioxide a reaction will produce. When a prediction fails, the assumptions are re-examined.\n\n### Estimation\n- Understand the situation first, identify the quantities, then make a rough estimate to check that the answer is sensible (about 20,000 breaths and roughly 10,000 litres of air a day).',
    'Cell: The Building Block of Life - Study Notes': '## Cell: The Building Block of Life\n\n### 2.1 How to study cells\n- A cell is usually far below the **limit of resolution** of the human eye (about 0.1 mm). The **light microscope** uses a convex lens and an eyepiece; an **electron microscope** uses a beam of electrons and resolves the nanometre scale.\n- Estimate a cell size: measure the field of view with a ruler on the stage (1 mm = 1000 micrometre), count the cells across the diameter and divide.\n\n### 2.2 Structure of a cell\n- The **cell membrane** is 7-10 nm thick, made of lipids and proteins, and is described by the **fluid-mosaic model**. It is selectively permeable: an **isotonic** solution has the same solute concentration as the cell, a **hypertonic** solution has more, and a **hypotonic** solution less.\n- The **cell wall** is the extra rigid outer covering of plant cells; it gives rigidity and strength, and animal cells have none of it.\n\n### 2.3 The cell interior\n- **Nucleus** (with nucleolus and nuclear pores) holds the coded instructions; **ribosomes** are the protein factories; the **endoplasmic reticulum** (rough for proteins, smooth for fats and hormones); the **Golgi apparatus** modifies, sorts and packages; **lysosomes** are the clean-up system; **mitochondria** are the powerhouse of the cell; **chloroplasts** carry chlorophyll for photosynthesis; **vacuoles** store and give rigidity.\n- **Prokaryotic** cells (bacteria) have no membrane-bound nucleus or organelles and are 1-10 micrometres; **eukaryotic** cells are 10-100 micrometres and have both.\n\n### 2.4 and 2.5 Division and cell theory\n- **Mitosis** gives two genetically identical daughter cells; **meiosis** divides twice and gives four gametes with half the chromosomes.\n- **Cell theory**: all living organisms are made of cells; the cell is the basic unit of life (Schleiden, 1838, and Virchow). Cells do not live forever - programmed cell death removes them, and uncontrolled growth leads to tumours.',
    'Tissues in Action - Study Notes': '## Tissues in Action\n\n### Levels of organisation and division of labour\n- A **tissue** is a group of cells similar in structure that work together for a specific function. Cells form tissues, tissues form organs, organs form organ systems, and organ systems form an organism. The division of labour makes the body efficient.\n\n### 3.1-3.2 Plant tissues\n- Plants stay fixed and upright, so their cells have a rigid **cell wall**; animals move about and their cells can change shape. Plants make their own food by photosynthesis, animals obtain food from outside.\n- **Meristematic tissue** is made of actively dividing cells. The **apical meristem** at the tips of roots and shoots makes the plant grow in length (cut the tip of an onion root and it stops growing); the **lateral meristem** makes the stem grow in girth and produces the **annual growth rings** used to age a tree; the **intercalary meristem** lets grass regrow after grazing. **Permanent tissues** are the mature tissues that carry out the work.\n\n### 3.3 Animal tissues\n- **Epithelial tissue** covers the body and lines organs; **connective tissue** joins and supports - blood is fluid, bone is rigid (calcium and phosphorus give it strength), cartilage is smooth, **tendons** connect muscle to bone and **ligaments** connect bone to bone; **muscular tissue** moves the body; **nervous tissue** carries messages, and its cells are called **neurons**.\n\n### 3.4-3.6 Muscles, joints and skeleton\n- Muscles pull on bones; a muscle only pulls, never pushes. The **ball and socket** joint (shoulder, hip) allows movement in all directions, the **hinge** joint (elbow, knee) works in one plane, the **pivot** joint (neck) turns the head and the **fixed** joint (skull) allows no movement.',
    'Describing Motion Around Us - Study Notes': '## Describing Motion Around Us\n\n### 4.1 Motion in a straight line\n- To describe the position of an object you need a **reference point**: the distance and the direction from it. If the position changes with time the object is in motion; if it does not, the object is at rest.\n- **Distance travelled** is the total length of the path (a scalar, no direction). **Displacement** is the straight line from the initial to the final position (a vector, it has direction). A 160 m round of a circular track gives a distance of 160 m but a displacement of 0 m.\n- **Average speed** = total distance travelled / time interval (no direction). **Average velocity** = change in position / time interval (has direction). **Average acceleration** = change in velocity / time interval.\n\n### 4.2 Graphs\n- On a **position-time graph** the slope gives the speed; a horizontal line means the object is at rest and a curve means it is speeding up or slowing down.\n- On a **velocity-time graph** the slope gives the acceleration and the area under the graph gives the displacement; a horizontal line means constant velocity.\n\n### 4.3 Kinematic equations (constant acceleration)\n- v = u + at\n- s = ut + (1/2) a t squared\n- v squared = u squared + 2as\nwhere u is the initial velocity, v the final velocity, a the acceleration, t the time and s the displacement.\n\n### 4.4 Motion in a plane\n- In **uniform circular motion** the speed stays constant but the direction changes continuously, so the acceleration always points towards the centre of the circle.',
    'Exploring Mixtures and their Separation - Study Notes': '## Exploring Mixtures and their Separation\n\n### 5.1 Classifying mixtures\n- A **homogeneous mixture** has a uniform composition - every sip of a stirred sugar-and-water mixture tastes the same. Such a mixture is also called a **solution** and it stays homogeneous (vinegar, soda).\n- A **heterogeneous mixture** is not uniform; the components can be seen and settle with time (sand in water, oil and water).\n\n### 5.2 Solutions, concentration and solubility\n- **Concentration** tells how much solute is in a given quantity of solution. It is written as a mass percentage (mass of solute / mass of solution x 100) or a volume percentage.\n- **Solubility** is the maximum amount of solute that dissolves in a fixed quantity of solvent at a given temperature.\n\n### 5.3 Separating homogeneous mixtures\n- **Crystallisation**: evaporating the solvent slowly leaves the solute as crystals.\n- **Distillation**: the liquid is heated, the vapour condenses in a cold surface and is collected, and the solute stays behind.\n- **Paper chromatography**: the mixture is dissolved in a solvent that carries the components up a paper; the component that travels furthest is the most soluble.\n\n### 5.4-5.5 The other separations\n- **Immiscible liquids** (oil and water) are separated with a **separating funnel**.\n- **Sublimation**: a solid such as camphor or ammonium chloride changes directly into vapour and back (used to purify salt).\n- **Suspensions** have particles that settle; **colloids** do not settle and scatter a beam of light - the **Tyndall effect**.',
    'Orienting Yourself: The Use of Coordinates - Study Notes': '## Orienting Yourself: The Use of Coordinates\n\n### A system of coordinates\n- A **system of coordinates** is a structured framework (grid lines on a map or graph paper) that lets us describe the exact location of a point with numbers.\n- The idea is deeply Indian: the streets of the **Sindhu-Sarasvati** civilisation were laid out North-South and East-West about 10 metres apart, so a merchant could find a shop by counting units from the city centre. **Baudhayana** used the same East-West and North-South lines for his constructions; **Ujjayini** was the central longitude meridian; **Aryabhata** replaced the Greek chords with sines and mapped the sky with **celestial coordinates**; **Brahmagupta** formalised zero and negative numbers, without which the four-quadrant plane is impossible. **Descartes** (1637) formalised that any point in a plane needs just two numbers.\n\n### 1.3 The 2-d Cartesian coordinate system\n- The **x-axis** is horizontal, the **y-axis** vertical, and the **origin O** where they meet has coordinates (0, 0).\n- Distances to the right and upwards are positive; to the left and downwards, negative. A point P = (x, 0) lies on the x-axis and a point P = (0, y) lies on the y-axis.\n- The axes divide the plane into four **quadrants**: I (+,+), II (-,+), III (-,-), IV (+,-).\n\n### 1.4 Distance between two points\n- By the Baudhayana-Pythagoras theorem the distance between (x1, y1) and (x2, y2) is\n  d = root of [(x2 - x1) squared + (y2 - y1) squared].\n- For A(3, 4) and D(7, 1): d = root of (16 + 9) = 5 units.',
    'Introduction to Linear Polynomials - Study Notes': '## Introduction to Linear Polynomials\n\n### 2.1 Algebraic expressions\n- An **algebraic expression** is built from terms, **variables** (letter-numbers) and numbers. In 4x + 5y + 3, the variables are x and y, 4 and 5 are the **coefficients** of x and y, and 3 is the **constant**. Each part separated by + or - is a term.\n- A garden of length l and width w with fencing and seeds costs 200l + 160w + 50lw - two variables and a product term.\n- An expression with one variable and its powers is a **polynomial**. The highest power of the variable is its **degree**.\n\n### 2.2 Linear polynomials\n- A polynomial of **degree 1** (3z + 7) is a **linear polynomial**; degree 2 (x squared + 5x + 1) is quadratic; degree 3 (5y cubed + y squared + 2y - 1) is cubic; a constant such as 8 has degree 0.\n- The perimeter of a square of side x is 4x, a linear polynomial; a chess club fee of 200 plus 50 for every match is also linear in the number of matches.\n\n### 2.3-2.4 Patterns, growth and decay\n- Linear patterns can be explored with tiles and pictures: the nth term of a linear pattern is found from the constant difference between consecutive terms.\n- A quantity that **increases** by the same amount each step shows **linear growth**; one that decreases shows **linear decay**. The rules of a game - a joining fee plus a charge per match - are linear relationships.\n\n### 2.5-2.6 Solving and visualising\n- Linear relationships can be found from a table or from two equations such as 350 = 10a + b and 550 = 20a + b, and then solved for the unknowns.\n- The **graph** of a linear relationship is a straight line: y = 2x passes through the origin, y = -3x falls to the right, and the intercept tells where the line crosses an axis.',
    'The World of Numbers - Study Notes': '## The World of Numbers\n\n### 3.1 The dawn of mathematics\n- Mathematics began with the need to keep count. **One-to-one correspondence** - one pebble for every cow that left, one removed for every cow that returned - is the birth of the natural numbers.\n- The **Lebombo bone** (about 35,000 years old) carries 29 carved notches; the **Ishango bone** groups notches into 11, 13, 17 and 19, the primes between 10 and 20, and shows doubling.\n- In India, the Indus Valley centres at **Lothal and Harappa** used standardised weights for trade; the Vedas name all powers of 10 up to 10 to the 12 (parardha), and the *Lalitavistara* names them up to 10 to the 53.\n\n### 3.2 The revolution of shunyata (zero)\n- **Shunya** moved from philosophy to mathematics: the **Bakhshali manuscript** (3rd century CE) is the earliest use of the ten digits including 0, and **Brahmagupta** (c. 628 CE) wrote the rules for arithmetic with zero and with negative numbers.\n\n### 3.3-3.4 Integers and rational numbers\n- Integers extend the number system in both directions; -a is the **additive inverse** of a, and | -a | = |a |.\n- A **rational number** is p/q with q not 0, written in lowest terms. On the number line the rational numbers are **dense**: between any two of them there is always another, because their average lies between them.\n\n### 3.5-3.6 Irrational numbers and decimals\n- **sqrt(2)** cannot be written as a fraction: if 2q squared = p squared then p and q would both be even, contradicting lowest terms.\n- The **Baudhayana-Pythagoras Theorem** constructs it, and **pi** is irrational - Madhava gave the series pi = 4(1 - 1/3 + 1/5 - 1/7 + ...).\n- A rational decimal either terminates or repeats; a repeating block such as 142857 is a **cyclic number**, and 1/7 = 0.142857... .\n- An irrational decimal is non-terminating and non-recurring, like the digits of sqrt(2).',
    'Exploring Algebraic Identities - Study Notes': '## Exploring Algebraic Identities\n\n### 4.1-4.2 Seeing identities\n- Take three consecutive squares: add the smallest and the largest and subtract twice the middle one. 1 + 9 - 2 x 4 = 2, and 25 + 49 - 2 x 36 = 2 as well - the result is always 2. Algebra explains why.\n- Draw a square of side (a + b) and split it into a square of side a, a square of side b and two rectangles of area ab. The areas give the **standard identities**:\n  (a + b) squared = a squared + 2ab + b squared\n  (a - b) squared = a squared - 2ab + b squared\n  (a + b)(a - b) = a squared - b squared\n  (x + a)(x + b) = x squared + (a + b)x + ab\n- An identity holds for **all** values of the letters, so it may be checked with negative numbers too.\n\n### 4.3-4.6 Factorisation\n- Identities are the fastest way to factorise: x squared + 7x + 12 = (x + 3)(x + 4), and a squared - b squared = (a + b)(a - b).\n- **Algebra tiles** model the same identities with physical pieces, and the same factorisation can be done without tiles by splitting the middle term.\n\n### 4.7 Finding new identities\n- Identities can be built by comparing products: expanding (5m + 2n) cubed and (2n - 5m) cubed shows that (a + b) cubed - (a - b) cubed = 2b(3a squared + b squared).\n\n### 4.8 Simplifying rational expressions\n- A rational expression is simplified by cancelling the common factor in the numerator and the denominator, for example 7/12 divided by 5/100 = 7/12 x 100/5 = 35/3.',
};

  const demoInstitution = await prisma.institution.findUnique({ where: { code: 'DEMO01' } });
  const grantDemoAccess = async (contentId: string) => {
    if (!demoInstitution) return;
    await prisma.contentAssignment.createMany({
      data: [{ contentId, institutionId: demoInstitution.id }],
      skipDuplicates: true,
    });
  };

  for (const c of contentNodes) {
    const key = `${c.grade}|${c.subjectName}|${c.ch}`;
    const chapterId = CHAPTERS[key]?.id;
    const subjectId = CHAPTERS[key]?.subjectId;
    const concept = chapterId
      ? await prisma.concept.findFirst({ where: { name: c.concept, topic: { chapter: { id: chapterId } } } })
      : null;
    if (!concept) continue;
    const existsContent = await prisma.contentItem.findFirst({ where: { title: c.title } });
    if (existsContent) {
      if (existsContent.ownerType === 'INSTITUTION' && existsContent.institutionId === null) {
        await prisma.contentItem.update({
          where: { id: existsContent.id },
          data: { ownerType: 'PLATFORM', directSanroAvailable: true },
        });
        await grantDemoAccess(existsContent.id);
      }
      // refresh seeded content that changed since the row was first created
      // (e.g. a lesson video replaced after the row already existed)
      const mappedUrl = videoUrls[c.title] ?? null;
      const mappedDescription = notesTexts[c.title] ?? null;
      const mappedSegments = videoSegments[c.title] ?? null;
      if (
        existsContent.url !== mappedUrl ||
        existsContent.description !== mappedDescription ||
        JSON.stringify(existsContent.segments ?? null) !== JSON.stringify(mappedSegments)
      ) {
        await prisma.contentItem.update({
          where: { id: existsContent.id },
          data: { url: mappedUrl, description: mappedDescription, segments: mappedSegments },
        });
      }
      continue;
    }
    const created = await prisma.contentItem.create({
      data: {
        type: c.type,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        ownerType: 'PLATFORM',
        directSanroAvailable: true,
        title: c.title,
        durationSeconds: c.duration,
        url: videoUrls[c.title] ?? null,
        segments: videoSegments[c.title] ?? null,
        description: notesTexts[c.title] ?? null,
        institutionId: null,
        boardId: BOARD.id,
        subjectId,
        chapterId,
        conceptId: concept.id,
        createdById: demoUser?.id ?? null,
      },
    });
    await grantDemoAccess(created.id);
  }
}

async function seedAchievements() {
  const defs = await prisma.achievement.findMany({ select: { id: true, key: true } });

  const studentUser = await prisma.user.findUnique({ where: { email: 'student@sanroai.com' } });
  const student = studentUser ? await prisma.student.findUnique({ where: { userId: studentUser.id } }) : null;
  if (student) {
    await prisma.gamificationProfile.update({
      where: { studentId: student.id },
      data: { xp: 420, streakDays: 7, lastActiveAt: new Date() },
    });
    // a re-seed starts the demo history from scratch: the counter and the ledger
  // must always agree
  await prisma.xpEvent.deleteMany({ where: { studentId: student.id } });
    await prisma.xpEvent.create({ data: { studentId: student.id, xp: 420, reason: 'SEED' } });
    const awards = ['FIRST_LOGIN', 'FIRST_ASSESSMENT', 'STREAK_3', 'STREAK_7', 'PRACTICE_PRO', 'SPEED_DEMON'];
    for (const key of awards) {
      const ach = await prisma.achievement.findUnique({ where: { key } });
      if (ach) {
        await prisma.studentAchievement.upsert({
          where: { studentId_achievementId: { studentId: student.id, achievementId: ach.id } },
          update: {},
          create: { studentId: student.id, achievementId: ach.id, unlockedAt: new Date() },
        });
      }
    }

    // Seed concept mastery for grade 10 concepts
    const grade10Chapters = await prisma.chapter.findMany({
      where: { grade: '10' },
      include: { topics: { include: { concepts: true } } },
    });
    const masteryData = [
      { chapterIdx: 0, topicIdx: 0, conceptIdx: 0, score: 85, level: 'MASTERED', attempts: 6 },
      { chapterIdx: 0, topicIdx: 0, conceptIdx: 1, score: 72, level: 'GOOD', attempts: 4 },
      { chapterIdx: 0, topicIdx: 1, conceptIdx: 0, score: 55, level: 'DEVELOPING', attempts: 3 },
      { chapterIdx: 1, topicIdx: 0, conceptIdx: 0, score: 90, level: 'MASTERED', attempts: 5 },
      { chapterIdx: 1, topicIdx: 0, conceptIdx: 1, score: 68, level: 'GOOD', attempts: 3 },
      { chapterIdx: 1, topicIdx: 1, conceptIdx: 0, score: 40, level: 'WEAK', attempts: 4 },
      { chapterIdx: 2, topicIdx: 0, conceptIdx: 0, score: 30, level: 'NEEDS_INTERVENTION', attempts: 5 },
    ];
    for (const m of masteryData) {
      const ch = grade10Chapters[m.chapterIdx];
      if (!ch) continue;
      const topic = ch.topics[m.topicIdx];
      if (!topic) continue;
      const concept = topic.concepts[m.conceptIdx];
      if (!concept) continue;
      await prisma.conceptMastery.upsert({
        where: { studentId_conceptId: { studentId: student.id, conceptId: concept.id } },
        update: { score: m.score, level: m.level as any, attempts: m.attempts ?? 1 },
        create: { studentId: student.id, conceptId: concept.id, score: m.score, level: m.level as any, attempts: m.attempts ?? 1, correct: 0, evidenceCount: 1 },
      });
    }
  }
}

async function main() {
  const target = parseTarget(TARGET_URL);
  const modeLabel = MODE === 'system' ? 'system only' : MODE === 'qa' ? 'QA fixtures' : 'system + demo';

  console.log(`[seed] mode: ${modeLabel}`);
  console.log(`[seed] target: ${target ? `${target.host}:${target.port || '5432'}/${target.database} (from ${target.source})` : TARGET_URL ? '<custom url>' : '<prisma default>'}`);

  if (target && !isLocalHost(target.host) && MODE !== 'system') {
    throw new Error(
      `Refusing to seed a non-local database host "${target.host}". Only the system bootstrap (seed.ts --system) may run remotely; --demo and --qa are development-only.`,
    );
  }

  if (target && !isLocalHost(target.host) && MODE === 'system') {
    console.log('[seed] remote host: system bootstrap only (plans, achievements, system institution, super admin)');
  }

  const sys = await seedSystem(prisma);
  console.log(`[seed] system: ${sys.plans} plans, ${sys.achievements} achievements, systemInstitution=${sys.systemInstitution ?? 'present'}, superAdmin=${sys.superAdmin ?? 'missing'}${sys.superAdminCreated ? ' (created)' : ''}`);
  for (const w of sys.warnings) console.warn(`[seed] WARNING: ${w}`);

  if (MODE === 'system') {
    console.log('[seed] system seed complete. No demo/academic data created.');
    return;
  }

  await seedCurriculum();
  await ensureSystemInstitution();
  const { academicYear, institution } = await seedPlansAndInstitution();
  const demoUsers = await seedUsers(institution.id, academicYear.id);
  await seedQuestions();
  await seedAchievements();
  await seedDemoAcademics({
    institutionId: institution.id,
    academicYearId: academicYear.id,
    teacherId: demoUsers.teacher.id,
    studentId: demoUsers.student.id,
    groupId: demoUsers.group.id,
  });
  await seedArContent(prisma);
  console.log('Seed complete: 1 board (CBSE), 10 grades, subjects, chapters, topics, concepts, demo users, question bank, content, AR/3D demo set & achievements.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());