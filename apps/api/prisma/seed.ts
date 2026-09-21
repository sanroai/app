import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedArContent } from './seed-ar';

const prisma = new PrismaClient();

const HASH = bcrypt.hashSync('Sanro@123', 10);

type ChapterSpec = {
  name: string;
  code: string;
  topics: { name: string; concepts: string[] }[];
};

const SCIENCE = 'Science';
const MATHS = 'Mathematics';

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
    [SCIENCE]: [
      {
        name: 'Materials in Daily Life',
        code: 'SCI-8-1',
        topics: [
          { name: 'Physical and Chemical Changes', concepts: ['Classification of Changes', 'Chemical Equations'] },
          { name: 'Fibres and Plastics', concepts: ['Types of Fibres', 'Plastics and the Environment'] },
        ],
      },
      {
        name: 'Matter and its Properties',
        code: 'SCI-8-2',
        topics: [
          { name: 'States of Matter', concepts: ['Solid, Liquid, Gas', 'Change of State'] },
          { name: 'Structure of an Atom', concepts: ['Subatomic Particles', 'Atomic Number and Mass Number'] },
        ],
      },
      {
        name: 'Motion and Force',
        code: 'SCI-8-3',
        topics: [
          { name: 'Force and Pressure', concepts: ['Effects of Force', 'Types of Pressure'] },
          { name: 'Friction', concepts: ['Causes of Friction', 'Friction in Daily Life'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Rational and Irrational Numbers',
        code: 'MAT-8-1',
        topics: [
          { name: 'Rational Numbers', concepts: ['Properties of Rational Numbers', 'Rational Numbers on the Number Line'] },
          { name: 'Irrational Numbers', concepts: ['Representing Irrational Numbers', 'Real Number System'] },
        ],
      },
      {
        name: 'Indices and Cube Root',
        code: 'MAT-8-2',
        topics: [
          { name: 'Indices', concepts: ['Laws of Indices', 'Negative Indices'] },
          { name: 'Cube and Cube Root', concepts: ['Perfect Cubes', 'Finding Cube Roots'] },
        ],
      },
      {
        name: 'Equations in One Variable',
        code: 'MAT-8-3',
        topics: [
          { name: 'Linear Equations', concepts: ['Balancing Method', 'Word Problems'] },
          { name: 'Applications', concepts: ['Perimeter and Area Problems', 'Age Problems'] },
        ],
      },
    ],
  },
  '9': {
    [SCIENCE]: [
      {
        name: 'Matter in Our Surroundings',
        code: 'SCI-9-1',
        topics: [
          { name: 'States of Matter', concepts: ['Solid, Liquid, Gas', 'Plasma'] },
          { name: 'Interparticle Forces', concepts: ['Diffusion', 'Evaporation and Boiling'] },
        ],
      },
      {
        name: 'Is Matter Around Us Pure?',
        code: 'SCI-9-2',
        topics: [
          { name: 'Mixtures', concepts: ['Homogeneous and Heterogeneous', 'Suspensions'] },
          { name: 'Solutions', concepts: ['Solute and Solvent', 'Concentration'] },
        ],
      },
      {
        name: 'Atoms and Molecules',
        code: 'SCI-9-3',
        topics: [
          { name: 'Atomic Theory', concepts: ['Dalton\'s Theory', 'Molecular Mass'] },
          { name: 'Chemical Formulae', concepts: ['Writing Formulae', 'Balancing Equations'] },
        ],
      },
      {
        name: 'Structure of the Atom',
        code: 'SCI-9-4',
        topics: [
          { name: 'Atomic Models', concepts: ['Thomson, Rutherford, Bohr', 'Electronic Configuration'] },
          { name: 'Isotopes and Isobars', concepts: ['Atomic Number', 'Mass Number'] },
        ],
      },
      {
        name: 'Force and Laws of Motion',
        code: 'SCI-9-5',
        topics: [
          { name: 'Newton\'s Laws', concepts: ['First Law and Inertia', 'Second and Third Laws'] },
          { name: 'Momentum and Impulse', concepts: ['Conservation of Momentum', 'Collisions'] },
        ],
      },
    ],
    [MATHS]: [
      {
        name: 'Number Systems',
        code: 'MAT-9-1',
        topics: [
          { name: 'Real Numbers', concepts: ['Rationalisation', 'Surds'] },
          { name: 'Laws of Exponents', concepts: ['Standard Form', 'Scientific Notation'] },
        ],
      },
      {
        name: 'Polynomials',
        code: 'MAT-9-2',
        topics: [
          { name: 'Types of Polynomials', concepts: ['Degree', 'Coefficients'] },
          { name: 'Algebraic Identities', concepts: ['Standard Identities', 'Factorisation'] },
        ],
      },
      {
        name: 'Linear Equations in Two Variables',
        code: 'MAT-9-3',
        topics: [
          { name: 'Graphing', concepts: ['Plotting Points', 'Line Graphs'] },
          { name: 'Solving Systems', concepts: ['Substitution', 'Elimination'] },
        ],
      },
      {
        name: 'Euclidean Geometry',
        code: 'MAT-9-4',
        topics: [
          { name: 'Axioms and Postulates', concepts: ['Euclid\'s Postulates', 'Undefined Terms'] },
          { name: 'Lines and Angles', concepts: ['Parallel Lines', 'Transversals'] },
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
        code: 'MAT-10-11',
        topics: [
          { name: 'Division of Line Segment', concepts: ['Internal Division', 'Golden Ratio'] },
          { name: 'Tangents', concepts: ['Tangent from External Point', 'Construction'] },
        ],
      },
      {
        name: 'Areas Related to Circles',
        code: 'MAT-10-12',
        topics: [
          { name: 'Area of Sector', concepts: ['Arc Length', 'Sector Area'] },
          { name: 'Segment Area', concepts: ['Minor and Major Segment', 'Composite Figures'] },
        ],
      },
      {
        name: 'Surface Areas and Volumes',
        code: 'MAT-10-13',
        topics: [
          { name: 'Solids', concepts: ['Cylinder, Cone, Sphere', 'Combination of Solids'] },
          { name: 'Conversion of Solids', concepts: ['Frustum', 'Surface Area Change'] },
        ],
      },
      {
        name: 'Statistics',
        code: 'MAT-10-14',
        topics: [
          { name: 'Measures of Central Tendency', concepts: ['Mean, Median, Mode', 'Grouped Data'] },
          { name: 'Ogive', concepts: ['Less Than and More Than', 'Median from Ogive'] },
        ],
      },
      {
        name: 'Probability',
        code: 'MAT-10-15',
        topics: [
          { name: 'Classical Probability', concepts: ['Favourable Outcomes', 'Sample Space'] },
          { name: 'Theoretical Probability', concepts: ['Events', 'Compound Events'] },
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
    [SCIENCE, MATHS].map((name, i) =>
      prisma.subject.upsert({
        where: { boardId_code: { boardId: BOARD.id, code: name === SCIENCE ? 'SCI' : 'MAT' } },
        update: {},
        create: { boardId: BOARD.id, code: name === SCIENCE ? 'SCI' : 'MAT', name, order: i, color: name === SCIENCE ? '#0ea5e9' : '#f97316' },
      }),
    ),
  );
  const subjectByName = (name: string) => subjects.find((s) => s.name === name)!;

  for (const gradeName of gradeNames) {
    for (const [subjectName, chapters] of Object.entries(CURRICULUM[gradeName])) {
      for (const ch of chapters) {
        const subj = subjectByName(subjectName);
        const chapter = await prisma.chapter.upsert({
          where: { subjectId_code: { subjectId: subj.id, code: ch.code } },
          update: {},
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
  const institutionPlan = await prisma.plan.upsert({
    where: { key: 'INSTITUTION' },
    update: {},
    create: { key: 'INSTITUTION', name: 'Institution Plan', perSeat: 100, priceYearly: 29999, active: true },
  });
  await prisma.plan.upsert({
    where: { key: 'STUDENT_MONTHLY' },
    update: {},
    create: { key: 'STUDENT_MONTHLY', name: 'Student Monthly', priceMonthly: 249, active: true },
  });
  await prisma.plan.upsert({
    where: { key: 'STUDENT_YEARLY' },
    update: {},
    create: { key: 'STUDENT_YEARLY', name: 'Student Yearly', priceYearly: 2499, active: true },
  });

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
    const existing = await prisma.assessment.findFirst({
      where: { institutionId, title: 'Matter in Our Surroundings — Class Test' },
    });
    const assessment = existing ?? (await prisma.assessment.create({
      data: {
        institutionId,
        title: 'Matter in Our Surroundings — Class Test',
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
    }));

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
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'MCQ',
      text: 'Which of the following is a physical change?',
      answer: 'Melting of ice',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Rusting of iron', isCorrect: false },
        { text: 'Burning of paper', isCorrect: false },
        { text: 'Melting of ice', isCorrect: true },
        { text: 'Digestion of food', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'MCQ',
      text: 'Rayon is which type of fibre?',
      answer: 'Semi-synthetic',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Natural', isCorrect: false },
        { text: 'Semi-synthetic', isCorrect: true },
        { text: 'Synthetic', isCorrect: false },
        { text: 'Metallic', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'SHORT_ANSWER',
      text: 'Differentiate between physical and chemical changes with one example each.',
      answer: 'Physical changes do not form a new substance (example: melting of ice); chemical changes form new substances (example: rusting of iron).',
      marks: 2,
    }),
    question('8', SCIENCE, 'Matter and its Properties', {
      type: 'MCQ',
      text: 'The three states of matter differ in which property?',
      answer: 'Particle arrangement',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Colour', isCorrect: false },
        { text: 'Particle arrangement', isCorrect: true },
        { text: 'Weight', isCorrect: false },
        { text: 'Temperature', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Matter and its Properties', {
      type: 'MCQ',
      text: 'Which particle is positively charged?',
      answer: 'Proton',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Electron', isCorrect: false },
        { text: 'Neutron', isCorrect: false },
        { text: 'Proton', isCorrect: true },
        { text: 'Anion', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Atoms and Molecules', {
      type: 'SHORT_ANSWER',
      text: 'State the two laws of chemical combination.',
      answer: 'Law of conservation of mass and law of constant proportion.',
      marks: 2,
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'MCQ',
      text: 'Force is measured in which SI unit?',
      answer: 'Newton',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Joule', isCorrect: false },
        { text: 'Newton', isCorrect: true },
        { text: 'Pascal', isCorrect: false },
        { text: 'Kelvin', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'MCQ',
      text: 'Friction is a force that acts __ to the direction of motion.',
      answer: 'Opposite',
      marks: 1,
      options: [
        { text: 'Parallel', isCorrect: false },
        { text: 'Perpendicular', isCorrect: false },
        { text: 'Opposite', isCorrect: true },
        { text: 'Same', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'SHORT_ANSWER',
      text: 'Why do we slip on a wet floor? Explain using the concept of friction.',
      answer: 'Water reduces friction between shoes and the floor, so the force needed to walk is not available and we slip.',
      marks: 2,
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'LONG_ANSWER',
      text: 'Explain the effect of force with two everyday examples and describe how pressure depends on area.',
      answer: 'Force can change the state of motion or shape of an object; examples: kicking a ball, squashing a sponge. Pressure is force per unit area, so the smaller the area the larger the pressure for the same force.',
      marks: 5,
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'MCQ',
      text: 'Which of the following is a rational number?',
      answer: '0.75',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'sqrt(2)', isCorrect: false },
        { text: 'pi', isCorrect: false },
        { text: '0.75', isCorrect: true },
        { text: 'sqrt(3)', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'MCQ',
      text: 'The decimal expansion of a rational number is either terminating or __.',
      answer: 'Non-terminating recurring',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Non-terminating recurring', isCorrect: true },
        { text: 'Non-terminating non-recurring', isCorrect: false },
        { text: 'Always terminating', isCorrect: false },
        { text: 'Always one digit', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'SHORT_ANSWER',
      text: 'Insert two rational numbers between 1/3 and 1/2.',
      answer: 'Answers like 5/12 and 7/18 are acceptable.',
      marks: 2,
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'MCQ',
      text: 'Simplify: 2^3 × 2^2',
      answer: '32',
      marks: 1,
      options: [
        { text: '64', isCorrect: false },
        { text: '32', isCorrect: true },
        { text: '16', isCorrect: false },
        { text: '12', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'MCQ',
      text: 'Which of these is a perfect cube?',
      answer: '216',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '100', isCorrect: false },
        { text: '216', isCorrect: true },
        { text: '64', isCorrect: false },
        { text: '144', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'SHORT_ANSWER',
      text: 'Find the value of 27^(2/3).',
      answer: '9',
      marks: 2,
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'MCQ',
      text: 'Solve: x + 5 = 12',
      answer: '7',
      marks: 1,
      options: [
        { text: '17', isCorrect: false },
        { text: '7', isCorrect: true },
        { text: '5', isCorrect: false },
        { text: '12', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'MCQ',
      text: 'The sum of three consecutive integers is 36. The integers are __.',
      answer: '11, 12, 13',
      marks: 1,
      options: [
        { text: '10, 11, 12', isCorrect: false },
        { text: '11, 12, 13', isCorrect: true },
        { text: '12, 13, 14', isCorrect: false },
        { text: '9, 10, 11', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'SHORT_ANSWER',
      text: 'A number is thrice another. Their sum is 48. Find the numbers.',
      answer: '12 and 36',
      marks: 2,
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'LONG_ANSWER',
      text: 'Raju’s age is 4 more than twice Shyam’s age. Five years ago, Raju was thrice as old as Shyam. Find their present ages.',
      answer: 'Shyam is 9 and Raju is 22.',
      marks: 5,
    }),
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'MCQ',
      text: 'Which of the following materials can be recycled?',
      answer: 'Paper',
      marks: 1,
      options: [
        { text: 'Polythene bags', isCorrect: false },
        { text: 'Paper', isCorrect: true },
        { text: 'Broken glass pieces', isCorrect: false },
        { text: 'Used syringes', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'MCQ',
      text: 'Which of these is a chemical change?',
      answer: 'Burning of a candle',
      marks: 1,
      options: [
        { text: 'Melting of wax', isCorrect: false },
        { text: 'Burning of a candle', isCorrect: true },
        { text: 'Sublimation of iodine', isCorrect: false },
        { text: 'Dissolving sugar in water', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Matter and its Properties', {
      type: 'MCQ',
      text: 'The mass number of an atom is the sum of __.',
      answer: 'Protons and neutrons',
      marks: 1,
      options: [
        { text: 'Protons and neutrons', isCorrect: true },
        { text: 'Protons and electrons', isCorrect: false },
        { text: 'Electrons and neutrons', isCorrect: false },
        { text: 'Only protons', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'SHORT_ANSWER',
      text: 'State the SI units of force and pressure.',
      answer: 'Force is measured in newtons (N) and pressure in pascals (Pa).',
      marks: 2,
    }),
    question('8', SCIENCE, 'Motion and Force', {
      type: 'MCQ',
      text: 'Rolling friction is __ than sliding friction.',
      answer: 'Less',
      marks: 1,
      options: [
        { text: 'Less', isCorrect: true },
        { text: 'Greater', isCorrect: false },
        { text: 'Equal', isCorrect: false },
        { text: 'Always zero', isCorrect: false },
      ],
    }),
    question('8', SCIENCE, 'Matter and its Properties', {
      type: 'SHORT_ANSWER',
      text: 'Why do gases fill the entire vessel they are kept in?',
      answer: 'Gas particles are far apart and move freely in all directions, so they spread to fill the whole container.',
      marks: 2,
    }),
    question('8', SCIENCE, 'Materials in Daily Life', {
      type: 'LONG_ANSWER',
      text: 'Explain the difference between natural and synthetic fibres, giving two examples of each and one use.',
      answer: 'Natural fibres come from plants or animals (cotton, wool) and are used in clothing; synthetic fibres are made from chemicals (nylon, polyester) and are strong, water-resistant and used in ropes, bags and sportswear.',
      marks: 5,
    }),
    question('8', SCIENCE, 'Matter and its Properties', {
      type: 'LONG_ANSWER',
      text: 'Describe Rutherford’s model of the atom and its main limitations.',
      answer: 'Rutherford proposed that most of the atom is empty space with a tiny dense positively charged nucleus at the centre and electrons moving around it; its limitation is that it could not explain the stability of the atom or the discrete atomic spectra.',
      marks: 5,
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'MCQ',
      text: 'Which of the following is an irrational number?',
      answer: '5.0101001000100001...',
      marks: 1,
      options: [
        { text: '0.5', isCorrect: false },
        { text: '5.0101001000100001...', isCorrect: true },
        { text: '0.25', isCorrect: false },
        { text: '1/3', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'MCQ',
      text: 'Which property states a × 0 = 0 for rational numbers?',
      answer: 'Multiplicative property of zero',
      marks: 1,
      options: [
        { text: 'Commutative property', isCorrect: false },
        { text: 'Associative property', isCorrect: false },
        { text: 'Multiplicative property of zero', isCorrect: true },
        { text: 'Distributive property', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'MCQ',
      text: 'What is the cube root of 512?',
      answer: '8',
      marks: 1,
      options: [
        { text: '6', isCorrect: false },
        { text: '8', isCorrect: true },
        { text: '12', isCorrect: false },
        { text: '16', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'MCQ',
      text: 'Simplify: (a^3)^2',
      answer: 'a^6',
      marks: 1,
      options: [
        { text: 'a^5', isCorrect: false },
        { text: 'a^6', isCorrect: true },
        { text: 'a^9', isCorrect: false },
        { text: 'a^23', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'MCQ',
      text: 'If 3x = 21, then x = ?',
      answer: '7',
      marks: 1,
      options: [
        { text: '18', isCorrect: false },
        { text: '7', isCorrect: true },
        { text: '24', isCorrect: false },
        { text: '63', isCorrect: false },
      ],
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'SHORT_ANSWER',
      text: 'Represent √2 on the number line.',
      answer: 'Construct a right triangle with legs 1 and 1, whose hypotenuse √2 is then marked on the number line using a compass.',
      marks: 2,
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'SHORT_ANSWER',
      text: 'Simplify using laws of indices: x^5 × x^3.',
      answer: 'x^8 (add the indices when bases are the same and multiplied).',
      marks: 2,
    }),
    question('8', MATHS, 'Indices and Cube Root', {
      type: 'SHORT_ANSWER',
      text: 'Find the smallest number by which 200 must be multiplied to make it a perfect cube.',
      answer: '5, since 200 = 2^3 × 5^2, multiplying by 5 gives 2^3 × 5^3.',
      marks: 2,
    }),
    question('8', MATHS, 'Rational and Irrational Numbers', {
      type: 'LONG_ANSWER',
      text: 'Compare and order the numbers 0.6, 2/3 and √0.69 from smallest to largest.',
      answer: '0.6 = 0.600, 2/3 ≈ 0.667, √0.69 ≈ 0.831, so the order is 0.6, 2/3, √0.69.',
      marks: 5,
    }),
    question('8', MATHS, 'Equations in One Variable', {
      type: 'LONG_ANSWER',
      text: 'The length of a rectangle is 3 cm more than its breadth. If the perimeter is 62 cm, find the length and breadth.',
      answer: 'Let breadth be x and length be x + 3. Perimeter 2(x + (x+3)) = 62, so 4x + 6 = 62, x = 14. Length = 17 cm and breadth = 14 cm.',
      marks: 5,
    }),

    question('10', SCIENCE, 'Chemical Reactions and Equations', {
      type: 'MCQ',
      text: 'Which of the following is an example of a combination reaction?',
      answer: 'CaO + CO2 → CaCO3',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'CaCO3 → CaO + CO2', isCorrect: false },
        { text: 'CaO + CO2 → CaCO3', isCorrect: true },
        { text: 'Zn + H2SO4 → ZnSO4 + H2', isCorrect: false },
        { text: 'NaOH + HCl → NaCl + H2O', isCorrect: false },
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

    question('9', SCIENCE, 'Matter in Our Surroundings', {
      type: 'MCQ',
      text: 'Which state of matter has the least intermolecular force?',
      answer: 'Gas',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Solid', isCorrect: false },
        { text: 'Liquid', isCorrect: false },
        { text: 'Gas', isCorrect: true },
        { text: 'Plasma', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Structure of the Atom', {
      type: 'MCQ',
      text: 'The atomic number of an element is equal to the number of __.',
      answer: 'Protons',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: 'Neutrons', isCorrect: false },
        { text: 'Protons', isCorrect: true },
        { text: 'Electrons', isCorrect: false },
        { text: 'Protons and neutrons', isCorrect: false },
      ],
    }),
    question('9', SCIENCE, 'Force and Laws of Motion', {
      type: 'SHORT_ANSWER',
      text: 'State Newton\'s second law of motion.',
      answer: 'The rate of change of momentum of a body is directly proportional to the applied force and takes place in the direction of the force. F = ma.',
      marks: 2,
    }),
    question('9', MATHS, 'Number Systems', {
      type: 'SHORT_ANSWER',
      text: 'Rationalise the denominator of 1/sqrt(3).',
      answer: '1/sqrt(3) * sqrt(3)/sqrt(3) = sqrt(3)/3',
      marks: 2,
    }),
    question('9', MATHS, 'Polynomials', {
      type: 'MCQ',
      text: 'If P(x) = x^2 - 4, then P(2) = ?',
      answer: '0',
      marks: 1,
      difficulty: 'EASY',
      options: [
        { text: '0', isCorrect: true },
        { text: '2', isCorrect: false },
        { text: '4', isCorrect: false },
        { text: '-4', isCorrect: false },
      ],
    }),
  ];

  const QUESTION_CONCEPT: Record<string, string> = {
    'Which of the following is a physical change?': 'Classification of Changes',
    'Rayon is which type of fibre?': 'Types of Fibres',
    'Differentiate between physical and chemical changes with one example each.': 'Classification of Changes',
    'Which of the following materials can be recycled?': 'Plastics and the Environment',
    'Which of these is a chemical change?': 'Classification of Changes',
    'Explain the difference between natural and synthetic fibres, giving two examples of each and one use.': 'Types of Fibres',
    'The three states of matter differ in which property?': 'Solid, Liquid, Gas',
    'Which particle is positively charged?': 'Subatomic Particles',
    "State the two laws of chemical combination.": "Dalton's Theory",
    'The mass number of an atom is the sum of __.': 'Atomic Number and Mass Number',
    'Why do gases fill the entire vessel they are kept in?': 'Solid, Liquid, Gas',
    'Describe Rutherford’s model of the atom and its main limitations.': 'Subatomic Particles',
    'Force is measured in which SI unit?': 'Effects of Force',
    'Friction is a force that acts __ to the direction of motion.': 'Causes of Friction',
    'Why do we slip on a wet floor? Explain using the concept of friction.': 'Friction in Daily Life',
    'Explain the effect of force with two everyday examples and describe how pressure depends on area.': 'Effects of Force',
    'State the SI units of force and pressure.': 'Effects of Force',
    'Rolling friction is __ than sliding friction.': 'Causes of Friction',
    'Which of the following is a rational number?': 'Properties of Rational Numbers',
    'The decimal expansion of a rational number is either terminating or __.': 'Properties of Rational Numbers',
    'Insert two rational numbers between 1/3 and 1/2.': 'Rational Numbers on the Number Line',
    'Which of the following is an irrational number?': 'Representing Irrational Numbers',
    'Which property states a × 0 = 0 for rational numbers?': 'Properties of Rational Numbers',
    'Represent √2 on the number line.': 'Representing Irrational Numbers',
    'Compare and order the numbers 0.6, 2/3 and √0.69 from smallest to largest.': 'Real Number System',
    'Simplify: 2^3 × 2^2': 'Laws of Indices',
    'Which of these is a perfect cube?': 'Perfect Cubes',
    'Find the value of 27^(2/3).': 'Laws of Indices',
    'What is the cube root of 512?': 'Finding Cube Roots',
    'Simplify: (a^3)^2': 'Laws of Indices',
    'Simplify using laws of indices: x^5 × x^3.': 'Laws of Indices',
    'Find the smallest number by which 200 must be multiplied to make it a perfect cube.': 'Perfect Cubes',
    'Solve: x + 5 = 12': 'Balancing Method',
    'The sum of three consecutive integers is 36. The integers are __.': 'Word Problems',
    'A number is thrice another. Their sum is 48. Find the numbers.': 'Word Problems',
    'Raju’s age is 4 more than twice Shyam’s age. Five years ago, Raju was thrice as old as Shyam. Find their present ages.': 'Age Problems',
    'If 3x = 21, then x = ?': 'Balancing Method',
    'The length of a rectangle is 3 cm more than its breadth. If the perimeter is 62 cm, find the length and breadth.': 'Perimeter and Area Problems',
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
    'Which state of matter has the least intermolecular force?': 'Solid, Liquid, Gas',
    "The atomic number of an element is equal to the number of __.": 'Atomic Number',
    'State Newton\'s second law of motion.': 'Second and Third Laws',
    'Rationalise the denominator of 1/sqrt(3).': 'Rationalisation',
    'If P(x) = x^2 - 4, then P(2) = ?': 'Factorisation',
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
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Classification of Changes', type: 'VIDEO', title: 'Physical vs Chemical Changes - Video Lesson', duration: 600 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Classification of Changes', type: 'NOTES', title: 'Types of Changes - Study Notes', duration: 300 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Classification of Changes', type: 'ARTICLE', title: 'Everyday Examples of Physical and Chemical Changes', duration: 420 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Chemical Equations', type: 'NOTES', title: 'Chemical Reactions: Balancing Equations', duration: 480 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Chemical Equations', type: 'VIDEO', title: 'Writing Chemical Equations Step by Step', duration: 720 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Types of Fibres', type: 'VIDEO', title: 'Natural and Synthetic Fibres Explained', duration: 540 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Types of Fibres', type: 'NOTES', title: 'Fibres: Cotton, Silk, Nylon and More', duration: 360 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Plastics and the Environment', type: 'ARTICLE', title: 'Plastics and Environmental Impact', duration: 300 },
    { ch: 'Materials in Daily Life', subjectName: SCIENCE, grade: '8', concept: 'Plastics and the Environment', type: 'VIDEO', title: 'Biodegradable vs Non-biodegradable Materials', duration: 480 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Solid, Liquid, Gas', type: 'VIDEO', title: 'States of Matter - Interactive Lesson', duration: 660 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Solid, Liquid, Gas', type: 'NOTES', title: 'Properties of Solids, Liquids and Gases', duration: 400 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Change of State', type: 'VIDEO', title: 'Melting, Boiling and Condensation', duration: 540 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Change of State', type: 'NOTES', title: 'Changes of State - Study Guide', duration: 350 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Subatomic Particles', type: 'VIDEO', title: 'Structure of an Atom - Video', duration: 720 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Subatomic Particles', type: 'NOTES', title: 'Protons, Neutrons and Electrons', duration: 380 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Subatomic Particles', type: 'ARTICLE', title: 'Rutherford\'s Gold Foil Experiment Explained', duration: 420 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Atomic Number and Mass Number', type: 'VIDEO', title: 'Atomic Number vs Mass Number', duration: 480 },
    { ch: 'Matter and its Properties', subjectName: SCIENCE, grade: '8', concept: 'Atomic Number and Mass Number', type: 'NOTES', title: 'Calculating Atomic Number and Mass Number', duration: 300 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Effects of Force', type: 'VIDEO', title: 'Effects of Force on Objects - Visual Guide', duration: 600 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Effects of Force', type: 'ARTICLE', title: 'Effects of Force Explained', duration: 360 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Effects of Force', type: 'NOTES', title: 'Force: Types and Effects - Summary', duration: 300 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Types of Pressure', type: 'VIDEO', title: 'Pressure in Fluids and Solids', duration: 540 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Types of Pressure', type: 'NOTES', title: 'Understanding Pressure - Notes', duration: 350 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Causes of Friction', type: 'VIDEO', title: 'What Causes Friction? - Science Lesson', duration: 480 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Causes of Friction', type: 'NOTES', title: 'Friction: Causes and Effects', duration: 320 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Friction in Daily Life', type: 'ARTICLE', title: 'Friction in Everyday Life - Real World Examples', duration: 400 },
    { ch: 'Motion and Force', subjectName: SCIENCE, grade: '8', concept: 'Friction in Daily Life', type: 'VIDEO', title: 'Reducing and Increasing Friction', duration: 420 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Properties of Rational Numbers', type: 'VIDEO', title: 'Rational Numbers: Properties and Operations', duration: 660 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Properties of Rational Numbers', type: 'NOTES', title: 'Properties of Rational Numbers - Cheat Sheet', duration: 300 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Rational Numbers on the Number Line', type: 'VIDEO', title: 'Plotting Rational Numbers on Number Line', duration: 540 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Rational Numbers on the Number Line', type: 'NOTES', title: 'Number Line Representation - Guide', duration: 280 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Representing Irrational Numbers', type: 'VIDEO', title: 'Understanding Irrational Numbers', duration: 480 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Representing Irrational Numbers', type: 'NOTES', title: 'Irrational Numbers and Their Representations', duration: 320 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Real Number System', type: 'VIDEO', title: 'The Real Number System Explained', duration: 540 },
    { ch: 'Rational and Irrational Numbers', subjectName: MATHS, grade: '8', concept: 'Real Number System', type: 'NOTES', title: 'Real Numbers Classification Chart', duration: 260 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Laws of Indices', type: 'VIDEO', title: 'Laws of Indices - Step by Step', duration: 600 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Laws of Indices', type: 'NOTES', title: 'Index Laws Summary and Examples', duration: 350 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Laws of Indices', type: 'ARTICLE', title: 'Practice Problems on Indices', duration: 400 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Negative Indices', type: 'VIDEO', title: 'Negative and Zero Indices Explained', duration: 480 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Negative Indices', type: 'NOTES', title: 'Working with Negative Indices', duration: 280 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Perfect Cubes', type: 'VIDEO', title: 'Perfect Cubes and Cube Roots', duration: 540 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Perfect Cubes', type: 'NOTES', title: 'List of Perfect Cubes up to 1000', duration: 200 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Finding Cube Roots', type: 'VIDEO', title: 'Methods to Find Cube Roots', duration: 480 },
    { ch: 'Indices and Cube Root', subjectName: MATHS, grade: '8', concept: 'Finding Cube Roots', type: 'NOTES', title: 'Cube Root Calculation Techniques', duration: 300 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Balancing Method', type: 'VIDEO', title: 'Solving Linear Equations - Balancing Method', duration: 600 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Balancing Method', type: 'NOTES', title: 'Step-by-Step Equation Solving', duration: 350 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Balancing Method', type: 'ARTICLE', title: 'Common Mistakes in Solving Equations', duration: 300 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Word Problems', type: 'VIDEO', title: 'Translating Word Problems to Equations', duration: 540 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Word Problems', type: 'NOTES', title: 'Word Problem Solving Strategies', duration: 320 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Perimeter and Area Problems', type: 'VIDEO', title: 'Equations for Perimeter and Area', duration: 480 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Perimeter and Area Problems', type: 'NOTES', title: 'Geometry Word Problems - Notes', duration: 300 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Age Problems', type: 'VIDEO', title: 'Solving Age Problems with Equations', duration: 420 },
    { ch: 'Equations in One Variable', subjectName: MATHS, grade: '8', concept: 'Age Problems', type: 'NOTES', title: 'Age Problems: Patterns and Solutions', duration: 280 },

    { ch: 'Matter in Our Surroundings', subjectName: SCIENCE, grade: '9', concept: 'Solid, Liquid, Gas', type: 'VIDEO', title: 'States of Matter - Class 9', duration: 600 },
    { ch: 'Matter in Our Surroundings', subjectName: SCIENCE, grade: '9', concept: 'Solid, Liquid, Gas', type: 'NOTES', title: 'States of Matter - Detailed Notes', duration: 400 },
    { ch: 'Matter in Our Surroundings', subjectName: SCIENCE, grade: '9', concept: 'Diffusion', type: 'VIDEO', title: 'Diffusion and Intermolecular Space', duration: 480 },
    { ch: 'Matter in Our Surroundings', subjectName: SCIENCE, grade: '9', concept: 'Diffusion', type: 'NOTES', title: 'Diffusion Explained', duration: 300 },
    { ch: 'Is Matter Around Us Pure?', subjectName: SCIENCE, grade: '9', concept: 'Homogeneous and Heterogeneous', type: 'VIDEO', title: 'Mixtures and their Types', duration: 540 },
    { ch: 'Is Matter Around Us Pure?', subjectName: SCIENCE, grade: '9', concept: 'Homogeneous and Heterogeneous', type: 'NOTES', title: 'Types of Mixtures - Study Guide', duration: 350 },
    { ch: 'Is Matter Around Us Pure?', subjectName: SCIENCE, grade: '9', concept: 'Solute and Solvent', type: 'VIDEO', title: 'Solutions, Solutes and Solvents', duration: 480 },
    { ch: 'Is Matter Around Us Pure?', subjectName: SCIENCE, grade: '9', concept: 'Solute and Solvent', type: 'NOTES', title: 'Solutions - Formulas and Examples', duration: 320 },
    { ch: 'Atoms and Molecules', subjectName: SCIENCE, grade: '9', concept: 'Dalton\'s Theory', type: 'VIDEO', title: 'Dalton\'s Atomic Theory', duration: 600 },
    { ch: 'Atoms and Molecules', subjectName: SCIENCE, grade: '9', concept: 'Dalton\'s Theory', type: 'NOTES', title: 'Atomic Theory - Key Points', duration: 380 },
    { ch: 'Atoms and Molecules', subjectName: SCIENCE, grade: '9', concept: 'Writing Formulae', type: 'VIDEO', title: 'Writing Chemical Formulae', duration: 540 },
    { ch: 'Atoms and Molecules', subjectName: SCIENCE, grade: '9', concept: 'Writing Formulae', type: 'NOTES', title: 'Chemical Formulae Guide', duration: 300 },
    { ch: 'Structure of the Atom', subjectName: SCIENCE, grade: '9', concept: 'Thomson, Rutherford, Bohr', type: 'VIDEO', title: 'Atomic Models Explained', duration: 720 },
    { ch: 'Structure of the Atom', subjectName: SCIENCE, grade: '9', concept: 'Thomson, Rutherford, Bohr', type: 'NOTES', title: 'Evolution of Atomic Models', duration: 420 },
    { ch: 'Structure of the Atom', subjectName: SCIENCE, grade: '9', concept: 'Atomic Number', type: 'VIDEO', title: 'Atomic Number and Mass Number', duration: 480 },
    { ch: 'Structure of the Atom', subjectName: SCIENCE, grade: '9', concept: 'Atomic Number', type: 'NOTES', title: 'Atomic Structure - Quick Reference', duration: 280 },
    { ch: 'Force and Laws of Motion', subjectName: SCIENCE, grade: '9', concept: 'First Law and Inertia', type: 'VIDEO', title: 'Newton\'s First Law of Motion', duration: 540 },
    { ch: 'Force and Laws of Motion', subjectName: SCIENCE, grade: '9', concept: 'First Law and Inertia', type: 'NOTES', title: 'Inertia and First Law - Notes', duration: 350 },
    { ch: 'Force and Laws of Motion', subjectName: SCIENCE, grade: '9', concept: 'Second and Third Laws', type: 'VIDEO', title: 'Newton\'s Second and Third Laws', duration: 600 },
    { ch: 'Force and Laws of Motion', subjectName: SCIENCE, grade: '9', concept: 'Second and Third Laws', type: 'NOTES', title: 'F = ma and Action-Reaction', duration: 380 },

    { ch: 'Number Systems', subjectName: MATHS, grade: '9', concept: 'Rationalisation', type: 'VIDEO', title: 'Rationalising the Denominator', duration: 480 },
    { ch: 'Number Systems', subjectName: MATHS, grade: '9', concept: 'Rationalisation', type: 'NOTES', title: 'Rationalisation Techniques', duration: 300 },
    { ch: 'Number Systems', subjectName: MATHS, grade: '9', concept: 'Surds', type: 'VIDEO', title: 'Working with Surds', duration: 540 },
    { ch: 'Number Systems', subjectName: MATHS, grade: '9', concept: 'Surds', type: 'NOTES', title: 'Surds - Simplification Rules', duration: 320 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '9', concept: 'Degree', type: 'VIDEO', title: 'Understanding Polynomial Degree', duration: 480 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '9', concept: 'Degree', type: 'NOTES', title: 'Polynomial Types and Degree', duration: 280 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '9', concept: 'Standard Identities', type: 'VIDEO', title: 'Algebraic Identities for Class 9', duration: 600 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '9', concept: 'Standard Identities', type: 'NOTES', title: 'Important Identities - Cheat Sheet', duration: 350 },
    { ch: 'Linear Equations in Two Variables', subjectName: MATHS, grade: '9', concept: 'Plotting Points', type: 'VIDEO', title: 'Graphing Linear Equations', duration: 540 },
    { ch: 'Linear Equations in Two Variables', subjectName: MATHS, grade: '9', concept: 'Plotting Points', type: 'NOTES', title: 'Cartesian Plane and Graphing', duration: 320 },
    { ch: 'Linear Equations in Two Variables', subjectName: MATHS, grade: '9', concept: 'Substitution', type: 'VIDEO', title: 'Solving by Substitution Method', duration: 480 },
    { ch: 'Linear Equations in Two Variables', subjectName: MATHS, grade: '9', concept: 'Substitution', type: 'NOTES', title: 'Substitution and Elimination Methods', duration: 300 },

    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Combination and Decomposition', type: 'VIDEO', title: 'Types of Chemical Reactions', duration: 660 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Combination and Decomposition', type: 'NOTES', title: 'Chemical Reactions - Complete Guide', duration: 420 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Law of Conservation of Mass', type: 'VIDEO', title: 'Balancing Chemical Equations', duration: 540 },
    { ch: 'Chemical Reactions and Equations', subjectName: SCIENCE, grade: '10', concept: 'Law of Conservation of Mass', type: 'NOTES', title: 'Balancing Equations - Practice Problems', duration: 350 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Litmus Test', type: 'VIDEO', title: 'Properties of Acids and Bases', duration: 600 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Litmus Test', type: 'NOTES', title: 'Acids and Bases - Study Notes', duration: 380 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Measuring pH', type: 'VIDEO', title: 'pH Scale Explained', duration: 480 },
    { ch: 'Acids, Bases and Salts', subjectName: SCIENCE, grade: '10', concept: 'Measuring pH', type: 'NOTES', title: 'pH Scale and Neutralisation', duration: 320 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Lustre, Conductivity', type: 'VIDEO', title: 'Physical Properties of Metals', duration: 540 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Lustre, Conductivity', type: 'NOTES', title: 'Metals vs Non-metals', duration: 350 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Reactivity Series', type: 'VIDEO', title: 'Reactivity Series of Metals', duration: 480 },
    { ch: 'Metals and Non-metals', subjectName: SCIENCE, grade: '10', concept: 'Reactivity Series', type: 'NOTES', title: 'Metallurgy and Reactivity', duration: 300 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Electron Sharing', type: 'VIDEO', title: 'Covalent Bonding in Carbon', duration: 600 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Electron Sharing', type: 'NOTES', title: 'Carbon Bonding - Detailed Notes', duration: 400 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Alcohols, Aldehydes', type: 'VIDEO', title: 'Functional Groups Explained', duration: 540 },
    { ch: 'Carbon and its Compounds', subjectName: SCIENCE, grade: '10', concept: 'Alcohols, Aldehydes', type: 'NOTES', title: 'Organic Chemistry - Functional Groups', duration: 350 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Autotrophic and Heterotrophic', type: 'VIDEO', title: 'Nutrition in Living Organisms', duration: 660 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Autotrophic and Heterotrophic', type: 'NOTES', title: 'Modes of Nutrition', duration: 400 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Circulatory System', type: 'VIDEO', title: 'Transport in Humans', duration: 540 },
    { ch: 'Life Processes', subjectName: SCIENCE, grade: '10', concept: 'Circulatory System', type: 'NOTES', title: 'Circulatory System - Notes', duration: 350 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Laws of Reflection', type: 'VIDEO', title: 'Reflection of Light', duration: 600 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Laws of Reflection', type: 'NOTES', title: 'Laws of Reflection - Summary', duration: 380 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Snell\'s Law', type: 'VIDEO', title: 'Refraction and Snell\'s Law', duration: 540 },
    { ch: 'Light - Reflection and Refraction', subjectName: SCIENCE, grade: '10', concept: 'Snell\'s Law', type: 'NOTES', title: 'Refraction - Formulas and Examples', duration: 350 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Ohm\'s Law', type: 'VIDEO', title: 'Ohm\'s Law Explained', duration: 540 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Ohm\'s Law', type: 'NOTES', title: 'Ohm\'s Law and Resistance', duration: 350 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Heating Effect', type: 'VIDEO', title: 'Electric Power and Energy', duration: 480 },
    { ch: 'Electricity', subjectName: SCIENCE, grade: '10', concept: 'Heating Effect', type: 'NOTES', title: 'Power, Energy, Joule\'s Law', duration: 320 },

    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'HCF', type: 'VIDEO', title: 'Euclid\'s Division Lemma', duration: 540 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'HCF', type: 'NOTES', title: 'HCF and LCM - Complete Guide', duration: 350 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'Decimal Expansion', type: 'VIDEO', title: 'Irrational Numbers and Decimals', duration: 480 },
    { ch: 'Real Numbers', subjectName: MATHS, grade: '10', concept: 'Decimal Expansion', type: 'NOTES', title: 'Real Numbers - Summary', duration: 300 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Zeroes of Polynomials', type: 'VIDEO', title: 'Zeroes and Graphs of Polynomials', duration: 540 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Zeroes of Polynomials', type: 'NOTES', title: 'Polynomial Zeroes - Notes', duration: 350 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Division Algorithm', type: 'VIDEO', title: 'Division Algorithm for Polynomials', duration: 480 },
    { ch: 'Polynomials', subjectName: MATHS, grade: '10', concept: 'Division Algorithm', type: 'NOTES', title: 'Remainder and Factor Theorem', duration: 300 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Factoring', type: 'VIDEO', title: 'Solving Quadratics by Factoring', duration: 540 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Factoring', type: 'NOTES', title: 'Factoring Quadratics - Methods', duration: 350 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Quadratic Formula', type: 'VIDEO', title: 'Quadratic Formula Explained', duration: 480 },
    { ch: 'Quadratic Equations', subjectName: MATHS, grade: '10', concept: 'Quadratic Formula', type: 'NOTES', title: 'Quadratic Formula and Discriminant', duration: 300 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'nth Term of an AP', type: 'VIDEO', title: 'Arithmetic Progression - nth Term', duration: 540 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'nth Term of an AP', type: 'NOTES', title: 'AP Formulas and Examples', duration: 350 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'Common Difference', type: 'VIDEO', title: 'Sum of n Terms of AP', duration: 480 },
    { ch: 'Arithmetic Progressions', subjectName: MATHS, grade: '10', concept: 'Common Difference', type: 'NOTES', title: 'Sum of AP - Practice Problems', duration: 300 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Sine, Cosine, Tangent', type: 'VIDEO', title: 'Trigonometric Ratios Explained', duration: 600 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Sine, Cosine, Tangent', type: 'NOTES', title: 'Trigonometry - Ratios and Table', duration: 400 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Pythagorean Identity', type: 'VIDEO', title: 'Trigonometric Identities', duration: 540 },
    { ch: 'Introduction to Trigonometry', subjectName: MATHS, grade: '10', concept: 'Pythagorean Identity', type: 'NOTES', title: 'Important Trig Identities', duration: 350 },
    { ch: 'Statistics', subjectName: MATHS, grade: '10', concept: 'Mean, Median, Mode', type: 'VIDEO', title: 'Mean, Median, Mode for Grouped Data', duration: 600 },
    { ch: 'Statistics', subjectName: MATHS, grade: '10', concept: 'Mean, Median, Mode', type: 'NOTES', title: 'Central Tendency - Formulas', duration: 380 },
    { ch: 'Probability', subjectName: MATHS, grade: '10', concept: 'Favourable Outcomes', type: 'VIDEO', title: 'Classical Probability', duration: 480 },
    { ch: 'Probability', subjectName: MATHS, grade: '10', concept: 'Favourable Outcomes', type: 'NOTES', title: 'Probability - Basic Concepts', duration: 300 },
    { ch: 'Triangles', subjectName: MATHS, grade: '10', concept: 'AA, SAS, SSS Criteria', type: 'VIDEO', title: 'Similarity of Triangles', duration: 540 },
    { ch: 'Triangles', subjectName: MATHS, grade: '10', concept: 'AA, SAS, SSS Criteria', type: 'NOTES', title: 'Similarity Criteria - Notes', duration: 350 },
    { ch: 'Coordinate Geometry', subjectName: MATHS, grade: '10', concept: 'Distance Between Points', type: 'VIDEO', title: 'Distance and Section Formula', duration: 480 },
    { ch: 'Coordinate Geometry', subjectName: MATHS, grade: '10', concept: 'Distance Between Points', type: 'NOTES', title: 'Coordinate Geometry Formulas', duration: 300 },
    { ch: 'Circles', subjectName: MATHS, grade: '10', concept: 'Tangent to a Circle', type: 'VIDEO', title: 'Tangents to a Circle', duration: 540 },
    { ch: 'Circles', subjectName: MATHS, grade: '10', concept: 'Tangent to a Circle', type: 'NOTES', title: 'Circle Theorems - Summary', duration: 350 },
    { ch: 'Surface Areas and Volumes', subjectName: MATHS, grade: '10', concept: 'Cylinder, Cone, Sphere', type: 'VIDEO', title: 'Surface Areas and Volumes', duration: 600 },
    { ch: 'Surface Areas and Volumes', subjectName: MATHS, grade: '10', concept: 'Cylinder, Cone, Sphere', type: 'NOTES', title: 'Mensuration Formulas', duration: 400 },
  ] as const;

  const demoUser = await prisma.user.findUnique({ where: { email: 'teacher@sanroai.com' } });

  const videoUrls: Record<string, string> = {
    'Physical vs Chemical Changes - Video Lesson': 'https://www.youtube.com/embed/AmEaXfq3hS0',
    'Writing Chemical Equations Step by Step': 'https://www.youtube.com/embed/zS4WcBNhPGw',
    'Natural and Synthetic Fibres Explained': 'https://www.youtube.com/embed/szX3fJU0y8Y',
    'Biodegradable vs Non-biodegradable Materials': 'https://www.youtube.com/embed/PRLmRMJTzFs',
    'States of Matter - Interactive Lesson': 'https://www.youtube.com/embed/Apc-3U0pcqI',
    'Melting, Boiling and Condensation': 'https://www.youtube.com/embed/I4KsGN-K1qo',
    'Structure of an Atom - Video': 'https://www.youtube.com/embed/1xSQ96gABXk',
    'Atomic Number vs Mass Number': 'https://www.youtube.com/embed/MfAmgmWYKWA',
    'Effects of Force on Objects - Visual Guide': 'https://www.youtube.com/embed/kEzbg5pKf1Y',
    'Pressure in Fluids and Solids': 'https://www.youtube.com/embed/ghGCBdO_5dM',
    'What Causes Friction? - Science Lesson': 'https://www.youtube.com/embed/8GnPH3tobqI',
    'Reducing and Increasing Friction': 'https://www.youtube.com/embed/eORAmD6jhDw',
    'Rational Numbers: Properties and Operations': 'https://www.youtube.com/embed/f2nKui-GXHI',
    'Plotting Rational Numbers on Number Line': 'https://www.youtube.com/embed/8wJvKpJSkKY',
    'Understanding Irrational Numbers': 'https://www.youtube.com/embed/cE96kVRqfPk',
    'The Real Number System Explained': 'https://www.youtube.com/embed/0fN7roDbCIg',
    'Laws of Indices - Step by Step': 'https://www.youtube.com/embed/9OeCnbfKHtQ',
    'Negative and Zero Indices Explained': 'https://www.youtube.com/embed/OjOzEY9Ab7g',
    'Perfect Cubes and Cube Roots': 'https://www.youtube.com/embed/fhSbTpdqE_Y',
    'Methods to Find Cube Roots': 'https://www.youtube.com/embed/b92d2L2h_nY',
    'Solving Linear Equations - Balancing Method': 'https://www.youtube.com/embed/LRpM7eWlO9E',
    'Translating Word Problems to Equations': 'https://www.youtube.com/embed/Ww2aDn4gVM4',
    'Equations for Perimeter and Area': 'https://www.youtube.com/embed/57A18pSZjGE',
    'Solving Age Problems with Equations': 'https://www.youtube.com/embed/3bCQm9WqM1I',
    'States of Matter - Class 9': 'https://www.youtube.com/embed/AmEaXfq3hS0',
    'Diffusion and Intermolecular Space': 'https://www.youtube.com/embed/zS4WcBNhPGw',
    'Mixtures and their Types': 'https://www.youtube.com/embed/szX3fJU0y8Y',
    'Solutions, Solutes and Solvents': 'https://www.youtube.com/embed/PRLmRMJTzFs',
    'Dalton\'s Atomic Theory': 'https://www.youtube.com/embed/Apc-3U0pcqI',
    'Writing Chemical Formulae': 'https://www.youtube.com/embed/I4KsGN-K1qo',
    'Atomic Models Explained': 'https://www.youtube.com/embed/1xSQ96gABXk',
    'Atomic Number and Mass Number': 'https://www.youtube.com/embed/MfAmgmWYKWA',
    'Newton\'s First Law of Motion': 'https://www.youtube.com/embed/kEzbg5pKf1Y',
    'Newton\'s Second and Third Laws': 'https://www.youtube.com/embed/ghGCBdO_5dM',
    'Rationalising the Denominator': 'https://www.youtube.com/embed/8GnPH3tobqI',
    'Working with Surds': 'https://www.youtube.com/embed/eORAmD6jhDw',
    'Understanding Polynomial Degree': 'https://www.youtube.com/embed/f2nKui-GXHI',
    'Algebraic Identities for Class 9': 'https://www.youtube.com/embed/8wJvKpJSkKY',
    'Graphing Linear Equations': 'https://www.youtube.com/embed/cE96kVRqfPk',
    'Solving by Substitution Method': 'https://www.youtube.com/embed/0fN7roDbCIg',
    'Types of Chemical Reactions': 'https://www.youtube.com/embed/AmEaXfq3hS0',
    'Balancing Chemical Equations': 'https://www.youtube.com/embed/zS4WcBNhPGw',
    'Properties of Acids and Bases': 'https://www.youtube.com/embed/szX3fJU0y8Y',
    'pH Scale Explained': 'https://www.youtube.com/embed/PRLmRMJTzFs',
    'Physical Properties of Metals': 'https://www.youtube.com/embed/Apc-3U0pcqI',
    'Reactivity Series of Metals': 'https://www.youtube.com/embed/I4KsGN-K1qo',
    'Covalent Bonding in Carbon': 'https://www.youtube.com/embed/1xSQ96gABXk',
    'Functional Groups Explained': 'https://www.youtube.com/embed/MfAmgmWYKWA',
    'Nutrition in Living Organisms': 'https://www.youtube.com/embed/kEzbg5pKf1Y',
    'Transport in Humans': 'https://www.youtube.com/embed/ghGCBdO_5dM',
    'Reflection of Light': 'https://www.youtube.com/embed/8GnPH3tobqI',
    'Refraction and Snell\'s Law': 'https://www.youtube.com/embed/eORAmD6jhDw',
    'Ohm\'s Law Explained': 'https://www.youtube.com/embed/f2nKui-GXHI',
    'Electric Power and Energy': 'https://www.youtube.com/embed/8wJvKpJSkKY',
    'Euclid\'s Division Lemma': 'https://www.youtube.com/embed/cE96kVRqfPk',
    'Irrational Numbers and Decimals': 'https://www.youtube.com/embed/0fN7roDbCIg',
    'Zeroes and Graphs of Polynomials': 'https://www.youtube.com/embed/9OeCnbfKHtQ',
    'Division Algorithm for Polynomials': 'https://www.youtube.com/embed/OjOzEY9Ab7g',
    'Solving Quadratics by Factoring': 'https://www.youtube.com/embed/fhSbTpdqE_Y',
    'Quadratic Formula Explained': 'https://www.youtube.com/embed/b92d2L2h_nY',
    'Arithmetic Progression - nth Term': 'https://www.youtube.com/embed/LRpM7eWlO9E',
    'Sum of n Terms of AP': 'https://www.youtube.com/embed/Ww2aDn4gVM4',
    'Trigonometric Ratios Explained': 'https://www.youtube.com/embed/57A18pSZjGE',
    'Trigonometric Identities': 'https://www.youtube.com/embed/3bCQm9WqM1I',
    'Mean, Median, Mode for Grouped Data': 'https://www.youtube.com/embed/AmEaXfq3hS0',
    'Classical Probability': 'https://www.youtube.com/embed/zS4WcBNhPGw',
    'Similarity of Triangles': 'https://www.youtube.com/embed/szX3fJU0y8Y',
    'Distance and Section Formula': 'https://www.youtube.com/embed/PRLmRMJTzFs',
    'Tangents to a Circle': 'https://www.youtube.com/embed/Apc-3U0pcqI',
    'Surface Areas and Volumes': 'https://www.youtube.com/embed/I4KsGN-K1qo',
  };

  const notesTexts: Record<string, string> = {
    'Types of Changes - Study Notes': '## Physical Changes\nA physical change alters the form or appearance of a substance without changing its chemical composition. Examples: melting ice, dissolving sugar, crumpling paper.\n\n## Chemical Changes\nA chemical change produces one or more new substances. Signs include color change, gas production, temperature change, and precipitate formation. Examples: rusting iron, burning wood, cooking food.\n\n## Key Differences\n| Physical Change | Chemical Change |\n|---|---|\n| Reversible | Usually irreversible |\n| No new substance | New substance formed |\n| Same composition | Different composition |',
    'Chemical Reactions: Balancing Equations': '## Chemical Equations\nA chemical equation represents a reaction using symbols and formulas.\n\n## Law of Conservation of Mass\nAtoms are neither created nor destroyed. The number of atoms of each element must be equal on both sides.\n\n## Steps to Balance\n1. Write the unbalanced equation\n2. Count atoms of each element on both sides\n3. Add coefficients to balance\n4. Verify the count\n\n## Example\nFe + O₂ → Fe₂O₃\n4Fe + 3O₂ → 2Fe₂O₃',
    'Fibres: Cotton, Silk, Nylon and More': '## Natural Fibres\n- **Cotton**: Soft, breathable, from cotton plant\n- **Wool**: Warm, from sheep fleece\n- **Silk**: Strong, shiny, from silkworm cocoons\n- **Jute**: Strong, from jute plant\n\n## Synthetic Fibres\n- **Nylon**: Strong, elastic, used in ropes and fabrics\n- **Polyester**: Wrinkle-resistant, quick-drying\n- **Acrylic**: Wool-like, used in sweaters\n\n## Properties\nNatural fibres absorb moisture; synthetic fibres are water-resistant and dry faster.',
    'Properties of Solids, Liquids and Gases': '## Solids\n- Definite shape and volume\n- Particles tightly packed\n- High density\n- Examples: ice, wood, stone\n\n## Liquids\n- Definite volume, no definite shape\n- Particles close but free to move\n- Flow and take container shape\n- Examples: water, milk, oil\n\n## Gases\n- No definite shape or volume\n- Particles far apart, random motion\n- Fill entire container\n- Examples: air, oxygen, nitrogen',
    'Changes of State - Study Guide': '## Melting\nSolid → Liquid (absorbs heat)\nExample: ice → water at 0°C\n\n## Freezing\nLiquid → Solid (releases heat)\nExample: water → ice at 0°C\n\n## Evaporation\nLiquid → Gas (at surface, any temperature)\n\n## Boiling\nLiquid → Gas (throughout, at boiling point)\n\n## Condensation\nGas → Liquid (releases heat)\nExample: water droplets on cold glass\n\n## Sublimation\nSolid → Gas (skipping liquid phase)\nExample: dry ice (solid CO₂)',
    'Protons, Neutrons and Electrons': '## Subatomic Particles\n\n| Particle | Charge | Mass | Location |\n|---|---|---|---|\n| Proton | +1 | 1 amu | Nucleus |\n| Neutron | 0 | 1 amu | Nucleus |\n| Electron | -1 | ~0 amu | Orbitals |\n\n## Key Points\n- Protons determine the element identity\n- Neutrons provide nuclear stability\n- Electrons determine chemical behavior\n- In neutral atom: number of protons = number of electrons',
    'Atomic Number and Mass Number': '## Atomic Number (Z)\n- Number of protons in the nucleus\n- Defines the element\n- Example: Carbon always has Z = 6\n\n## Mass Number (A)\n- Total protons + neutrons\n- Varies for isotopes\n\n## Notation\nᴬ_Z X where X is element symbol\n\n## Isotopes\nSame Z, different A (different neutrons)\nExample: Carbon-12 (6p + 6n), Carbon-14 (6p + 8n)\n\n## Number of Neutrons = A - Z',
    'Force: Types and Effects - Summary': '## What is Force?\nA push or pull on an object that can change its state of motion.\n\n## Effects of Force\n1. Change speed of an object\n2. Change direction of motion\n3. Change shape of an object\n4. Stop a moving object\n\n## Types of Force\n- **Contact Force**: Applied through direct contact (friction, normal force)\n- **Non-contact Force**: Acts at a distance (gravity, magnetic force)\n- **Balanced Forces**: Net force = 0, no change in motion\n- **Unbalanced Forces**: Net force ≠ 0, causes acceleration',
    'Understanding Pressure - Notes': '## Pressure\nPressure = Force / Area (P = F/A)\n\n## SI Unit\nPascal (Pa) = 1 N/m²\n\n## Atmospheric Pressure\n- Caused by weight of air above\n- ~101,325 Pa at sea level\n- Decreases with altitude\n\n## Liquid Pressure\n- Increases with depth\n- Same at same level\n- P = ρgh (ρ = density, g = gravity, h = height)\n\n## Applications\n- Hydraulic machines use liquid pressure\n- Blood pressure measurement\n- Weather forecasting',
    'Friction: Causes and Effects': '## What is Friction?\nA force that opposes relative motion between two surfaces in contact.\n\n## Causes\n- Surface roughness (microscopic irregularities)\n- Molecular adhesion between surfaces\n\n## Types\n- **Static Friction**: Prevents motion from starting\n- **Kinetic Friction**: Opposes ongoing motion\n- **Rolling Friction**: Opposes rolling motion (weakest)\n\n## Factors Affecting Friction\n1. Nature of surfaces\n2. Weight/normal force\n3. Contact area (minimal effect)\n\n## Advantages: Walking, braking, writing\n## Disadvantages: Wear, energy loss, heat',
    'States of Matter - Detailed Notes': '## States of Matter\n\n### Solid\n- Definite shape and volume\n- Particles vibrate in fixed positions\n- High density, incompressible\n\n### Liquid\n- Definite volume, takes shape of container\n- Particles slide past each other\n- Low compressibility\n\n### Gas\n- No definite shape or volume\n- Particles move freely at high speed\n- Highly compressible\n\n### Plasma\n- Ionized gas at very high temperature\n- Found in stars and fluorescent lights',
    'Diffusion Explained': '## Diffusion\nThe spontaneous mixing of particles of different substances.\n\n## Key Points\n- Particles are in constant random motion\n- Diffusion is faster at higher temperatures\n- Smaller particles diffuse faster\n- Example: Perfume spreading in a room\n\n## Intermolecular Space\n- Maximum in gases\n- Minimum in solids\n- Intermediate in liquids\n- Explains why gases are compressible',
    'Types of Mixtures - Study Guide': '## Homogeneous Mixtures\n- Uniform composition throughout\n- Examples: salt water, air, alloys\n- Cannot be separated by filtration\n\n## Heterogeneous Mixtures\n- Non-uniform composition\n- Examples: sand in water, oil and water\n- Can be separated by filtration\n\n## Separation Methods\n- Filtration (insoluble solids)\n- Evaporation (soluble solids)\n- Distillation (miscible liquids)\n- Chromatography (dissolved dyes)',
    'Solutions - Formulas and Examples': '## Solutions\nA homogeneous mixture of solute dissolved in solvent.\n\n## Key Terms\n- **Solute**: Substance dissolved (lesser amount)\n- **Solvent**: Substance doing the dissolving (greater amount)\n- **Solution**: Mixture of solute and solvent\n\n## Concentration\n- Mass percentage = (mass of solute / mass of solution) x 100\n- Volume percentage = (volume of solute / volume of solution) x 100\n- Moles per litre (molarity)\n\n## Types of Solutions\n- Saturated: Maximum solute dissolved\n- Unsaturated: Can dissolve more solute',
    'Atomic Theory - Key Points': '## Dalton\'s Atomic Theory (1808)\n1. Matter is made of tiny indivisible particles called atoms\n2. Atoms of same element are identical\n3. Atoms combine in simple whole number ratios\n4. Atoms cannot be created or destroyed\n\n## Limitations\n- Atoms are divisible (protons, neutrons, electrons)\n- Isotopes exist (same element, different masses)\n- Atoms of same element can have different masses\n\n## Modern Atomic Theory\n- Atoms have subatomic particles\n- Mass number varies for isotopes\n- Nuclear reactions can change atoms',
    'Chemical Formulae Guide': '## Writing Chemical Formulae\n1. Write symbols of elements\n2. Note valencies (combining capacity)\n3. Cross-multiply valencies\n4. Simplify ratio\n\n## Examples\n- NaCl: Na+ + Cl- -> NaCl\n- CaCl2: Ca2+ + 2Cl- -> CaCl2\n- Al2O3: 2Al3+ + 3O2- -> Al2O3\n\n## Polyatomic Ions\n- SO4 2- (sulphate)\n- NO3- (nitrate)\n- OH- (hydroxide)\n- NH4+ (ammonium)',
    'Evolution of Atomic Models': '## Thomson Model (1904)\n- Plum pudding model\n- Electrons embedded in positive sphere\n\n## Rutherford Model (1911)\n- Gold foil experiment\n- Most of atom is empty space\n- Tiny dense positively charged nucleus\n- Electrons orbit the nucleus\n\n## Bohr Model (1913)\n- Electrons in fixed energy levels\n- Explains atomic spectra\n- Electrons jump between levels\n\n## Modern Model\n- Quantum mechanical model\n- Electrons in probability clouds (orbitals)',
    'Atomic Structure - Quick Reference': '## Key Formulas\n- Mass Number (A) = Protons + Neutrons\n- Atomic Number (Z) = Number of Protons\n- Number of Neutrons = A - Z\n- Number of Electrons (neutral atom) = Z\n\n## Isotopes\nSame atomic number, different mass number\nExample: 1H (1p + 0n), 2H (1p + 1n), 3H (1p + 2n)\n\n## Isobars\nSame mass number, different atomic number\nExample: 40Ar (18p + 22n), 40Ca (20p + 20n)',
    'Inertia and First Law - Notes': '## Newton\'s First Law\nA body at rest stays at rest, and a body in uniform motion stays in that state unless acted upon by an external unbalanced force.\n\n## Inertia\nThe tendency of a body to resist change in its state of motion.\n\n## Types of Inertia\n1. **Inertia of Rest**: Body at rest tends to stay at rest\n2. **Inertia of Motion**: Body in motion tends to stay in motion\n3. **Inertia of Direction**: Body tends to maintain direction\n\n## Mass and Inertia\nGreater mass means greater inertia\n- Heavy object harder to push\n- Heavy object harder to stop',
    'F = ma and Action-Reaction': '## Newton\'s Second Law\nF = ma\n- Force = Mass x Acceleration\n- SI unit: 1 Newton = 1 kg x 1 m/s^2\n- Greater force means greater acceleration\n- Greater mass means less acceleration\n\n## Newton\'s Third Law\nFor every action, there is an equal and opposite reaction.\n- Forces always occur in pairs\n- Action and reaction act on different bodies\n- Same magnitude, opposite direction\n\n## Examples\n- Walking: foot pushes ground backward, ground pushes foot forward\n- Rocket: gas pushes down, rocket pushes up',
    'Rationalising the Denominator': '## Rationalisation\nRemoving the surd from the denominator of a fraction.\n\n## Method\nMultiply numerator and denominator by the conjugate.\n\n## Examples\n- 1/sqrt(2) x sqrt(2)/sqrt(2) = sqrt(2)/2\n- 1/(sqrt(3) + sqrt(2)) x (sqrt(3) - sqrt(2))/(sqrt(3) - sqrt(2)) = sqrt(3) - sqrt(2)\n- 3/(sqrt(5) - 1) x (sqrt(5) + 1)/(sqrt(5) + 1) = 3(sqrt(5) + 1)/4\n\n## Conjugate Pairs\n- sqrt(a) + sqrt(b) and sqrt(a) - sqrt(b)\n- (sqrt(a) + sqrt(b))(sqrt(a) - sqrt(b)) = a - b',
    'Working with Surds': '## Surds\nIrrational numbers expressed as roots.\n\n## Simplification\n- sqrt(ab) = sqrt(a) x sqrt(b)\n- sqrt(a/b) = sqrt(a) / sqrt(b)\n- sqrt(a) x sqrt(a) = a\n\n## Operations\n- Addition: 2sqrt(3) + 3sqrt(3) = 5sqrt(3)\n- Subtraction: 5sqrt(2) - 3sqrt(2) = 2sqrt(2)\n- Multiplication: sqrt(2) x sqrt(3) = sqrt(6)\n- Division: sqrt(12) / sqrt(3) = sqrt(4) = 2\n\n## Important Surds\nsqrt(2) = 1.414, sqrt(3) = 1.732, sqrt(5) = 2.236',
    'Understanding Polynomial Degree': '## Polynomial Degree\nThe highest power of the variable in the polynomial.\n\n## Types by Degree\n- **Constant**: Degree 0 (e.g., 5)\n- **Linear**: Degree 1 (e.g., 2x + 3)\n- **Quadratic**: Degree 2 (e.g., x^2 + 2x + 1)\n- **Cubic**: Degree 3 (e.g., x^3 - 4x + 1)\n\n## Coefficients\nThe numbers multiplied by variables\n- 3x^2 + 2x + 1\n- Coefficient of x^2 = 3\n- Coefficient of x = 2\n- Constant term = 1',
    'Polynomial Types and Degree': '## Polynomial Classification\n\n| Type | Degree | General Form |\n|---|---|---|\n| Constant | 0 | c |\n| Linear | 1 | ax + b |\n| Quadratic | 2 | ax^2 + bx + c |\n| Cubic | 3 | ax^3 + bx^2 + cx + d |\n\n## Value of a Polynomial\nSubstitute x = a to find P(a)\n- P(x) = x^2 + 2x + 1\n- P(3) = 9 + 6 + 1 = 16\n\n## Zero of a Polynomial\nValue of x for which P(x) = 0\n- P(x) = x - 3, zero at x = 3',
    'Algebraic Identities for Class 9': '## Standard Identities\n\n1. (a + b)^2 = a^2 + 2ab + b^2\n2. (a - b)^2 = a^2 - 2ab + b^2\n3. (a + b)(a - b) = a^2 - b^2\n4. (x + a)(x + b) = x^2 + (a + b)x + ab\n\n## Cubic Identities\n5. (a + b)^3 = a^3 + b^3 + 3ab(a + b)\n6. (a - b)^3 = a^3 - b^3 - 3ab(a - b)\n7. a^3 + b^3 = (a + b)(a^2 - ab + b^2)\n8. a^3 - b^3 = (a - b)(a^2 + ab + b^2)\n\n## Applications\n- Expanding expressions\n- Factorizing polynomials\n- Simplifying calculations',
    'Cartesian Plane and Graphing': '## Cartesian Plane\n- X-axis (horizontal) and Y-axis (vertical)\n- Origin (0,0) where axes meet\n- Four quadrants: I (+,+), II (-,+), III (-,-), IV (+,-)\n\n## Plotting Points\n- (x, y) format: x = horizontal, y = vertical\n- Example: A(3, 2) means 3 units right, 2 units up\n\n## Linear Equation Graph\n- y = mx + c (slope-intercept form)\n- m = slope, c = y-intercept\n- Graph is a straight line\n- To graph: find two points, draw line through them',
    'Substitution and Elimination Methods': '## Substitution Method\n1. Solve one equation for one variable\n2. Substitute into the other equation\n3. Solve for the remaining variable\n4. Back-substitute to find first variable\n\n## Elimination Method\n1. Multiply equations to make coefficients equal\n2. Add or subtract equations to eliminate one variable\n3. Solve for the remaining variable\n4. Back-substitute\n\n## Example\nx + y = 5\n2x - y = 1\n\nAdding: 3x = 6, so x = 2\nThen: 2 + y = 5, so y = 3',
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
    if (existsContent) continue;
    await prisma.contentItem.create({
      data: {
        type: c.type,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        title: c.title,
        durationSeconds: c.duration,
        url: videoUrls[c.title] ?? null,
        description: notesTexts[c.title] ?? null,
        institutionId: null,
        boardId: BOARD.id,
        subjectId,
        chapterId,
        conceptId: concept.id,
        createdById: demoUser?.id ?? null,
      },
    });
  }
}

async function seedAchievements() {
  const defs = [
    { key: 'FIRST_LOGIN', name: 'First Steps', description: 'Logged in for the first time', xp: 25, icon: 'star' },
    { key: 'FIRST_ASSESSMENT', name: 'First Assessment', description: 'Completed your first assessment', xp: 50, icon: 'clipboard' },
    { key: 'PERFECT_SCORE', name: 'Perfect Score', description: 'Scored 100% on any assessment', xp: 100, icon: 'trophy' },
    { key: 'STREAK_3', name: 'On Fire', description: 'Logged in 3 days in a row', xp: 30, icon: 'flame' },
    { key: 'STREAK_7', name: 'Week Warrior', description: 'Logged in 7 days in a row', xp: 75, icon: 'zap' },
    { key: 'CHAPTER_MASTER', name: 'Chapter Master', description: 'Completed all concepts in a chapter', xp: 150, icon: 'book' },
    { key: 'SPEED_DEMON', name: 'Speed Demon', description: 'Completed an assessment in under 5 minutes', xp: 40, icon: 'clock' },
    { key: 'PRACTICE_PRO', name: 'Practice Pro', description: 'Completed 5 practice quizzes', xp: 60, icon: 'brain' },
  ];

  const created: Record<string, string> = {};
  for (const d of defs) {
    const a = await prisma.achievement.upsert({
      where: { key: d.key },
      update: {},
      create: d,
    });
    created[d.key] = a.id;
  }

  const studentUser = await prisma.user.findUnique({ where: { email: 'student@sanroai.com' } });
  const student = studentUser ? await prisma.student.findUnique({ where: { userId: studentUser.id } }) : null;
  if (student) {
    await prisma.gamificationProfile.update({
      where: { studentId: student.id },
      data: { xp: 420, streakDays: 7, lastActiveAt: new Date() },
    });
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