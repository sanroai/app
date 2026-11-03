/**
 * Authored explanations, keyed by the question's text.
 *
 * One map, one lookup, one key. The question text is unique (the fragment
 * validator refuses duplicates), so this cannot drift onto the wrong question -
 * and a question whose text changes loses its explanation, which
 * `scripts/qa/audit-question-explanations.mts` reports as an orphan instead of
 * silently showing the wrong reasoning.
 *
 * Used in two places, so there is exactly one copy of the content:
 *  - `prisma/seed.ts` applies it on every seed (including the `--system`
 *    bootstrap), so a fresh install and a re-seed both carry it;
 *  - `POST /questions/sync-explanations` (super-admin) applies it to a deployed
 *    database, because the curriculum itself is never re-seeded in production.
 */
export const QUESTION_EXPLANATIONS: Record<string, string> = {
  'Which of the following is an example of a combination reaction?':
    'Two reactants - CaO and CO2 - join to form a single product, CaCO3, and that is the definition of a **combination reaction** (also called synthesis). NaOH + HCl -> NaCl + H2O and Zn + H2SO4 -> ZnSO4 + H2 both produce two products, and CaCO3 -> CaO + CO2 runs the other way: one reactant splitting into two products is **decomposition**.',
  'Write the balanced chemical equation for the reaction of zinc with dilute sulphuric acid.':
    'Zinc is above hydrogen in the reactivity series, so it pushes hydrogen out of the acid: **Zn + H2SO4 -> ZnSO4 + H2**. The equation is already balanced (1 Zn, 1 S, 4 O and 2 H on each side). Because a more reactive metal displaces hydrogen from the acid, this is a **displacement reaction** - the bubbles of hydrogen gas are the visible clue.',
  'Which statement correctly expresses the law of conservation of mass for a chemical reaction?':
    'The law says atoms are neither created nor destroyed in a chemical reaction, only rearranged, so the **total mass of the reactants equals the total mass of the products**. Mass is not destroyed when a gas escapes - the gas still has mass, it has simply left the container. Atoms do not turn into atoms of other elements, because that would be a nuclear change, not a chemical one.',
  'In the reaction ZnO + C → Zn + CO, which statement is correct?':
    'Carbon takes oxygen away from zinc oxide, so carbon is **oxidised** (it gains oxygen) and ZnO is **reduced** (it loses oxygen). Oxidation and reduction always occur together - the oxygen has to go somewhere - which is why this is called a **redox** reaction. Saying only one of them happens is the usual mistake.',
  'The reaction CaO + H2O gives Ca(OH)2 is an example of which type of reaction?':
    'Calcium oxide and water join to form **one single product**, calcium hydroxide, which is the signature of a **combination reaction**. Decomposition would start from a single reactant, and a displacement reaction would have a second product on the right-hand side.',
  'Which equation shows a more reactive metal displacing a less reactive metal from its salt solution?':
    'Zinc is more reactive than copper, so it takes copper\u2019s place in solution: **Zn + CuSO4 -> ZnSO4 + Cu**, and the blue colour fades as copper metal deposits. The reverse, Cu + ZnSO4, cannot happen because copper cannot displace the more reactive zinc. Silver is also less reactive than copper, so Ag + CuSO4 does not react either.',
  'A chemical equation is balanced because of which law?':
    'An equation is balanced to obey the **law of conservation of mass**: the number of atoms of each element must be the same on both sides because atoms are only rearranged. The law of definite proportions and the law of multiple proportions describe the fixed mass ratios inside a compound, not why an equation is balanced.',
  'In the reaction CuO + H2 gives Cu + H2O, the substance that is oxidised is:':
    'Hydrogen removes oxygen from copper(II) oxide and gains it itself, so **H2 is oxidised** to H2O while CuO is reduced to Cu. Remember **OIL RIG** - oxidation is loss of electrons, reduction is gain of electrons; in terms of oxygen, oxidation is gain and reduction is loss. Copper and water are products, not the substance being oxidised.',
  'Balance the equation Fe + H2O gives Fe3O4 + H2 and name the type of reaction.':
    '**3Fe + 4H2O -> Fe3O4 + 4H2**. Balance iron and oxygen first and hydrogen last: 3 Fe, 4 O and 8 H on each side. Iron gains oxygen (oxidised) while the hydrogen in water loses oxygen (reduced), so this is a **redox** reaction.',
  'A chemical equation must be balanced because of which law?':
    'An equation must be balanced to satisfy the **law of conservation of mass** - the total number of atoms of each element cannot change during a reaction. Newton\u2019s third law is about forces, and the laws of definite and multiple proportions are about the fixed mass ratios within a compound.',
  'Which of these is a decomposition reaction?':
    'Heating calcium carbonate splits **one compound into two simpler substances** (CaCO3 -> CaO + CO2), which is **thermal decomposition**. Iron rusting, zinc reacting with dilute acid and magnesium burning all involve a substance combining with oxygen or replacing another element; none of them starts with a single reactant breaking apart.',
  'In the reaction Fe + CuSO4 -> FeSO4 + Cu, what happens to iron?':
    'Iron is more reactive than copper, so it **displaces copper** from copper sulphate and dissolves as iron(II) sulphate, leaving copper metal behind: Fe + CuSO4 -> FeSO4 + Cu. You see the blue colour fade and a reddish-brown deposit form. Iron is the displacing metal here, not the one being displaced.',
  'Which indicator turns red in acidic solution?':
    'Methyl orange is **red in acid** and yellow in a base, so its acid colour is red in its own right. Blue litmus also ends up red in acid, but that is described as a change (blue -> red), which is the test for an acid rather than the indicator\u2019s own colour. Phenolphthalein stays colourless in acid and universal indicator shows a whole spectrum.',
  'What happens when sodium hydroxide reacts with hydrochloric acid?':
    'A base and an acid neutralise each other: **NaOH + HCl -> NaCl + H2O**. The Na+ and Cl- ions pair up as common salt while H+ and OH- join to form water. No gas is produced - bubbles would mean the acid had met a metal or a carbonate instead.',
  'The pH scale used to measure the acidic or basic nature of a solution generally ranges from':
    'The pH scale runs from **0 (most acidic)** through 7 (neutral) to **14 (most basic)**; below 7 is acidic and above 7 is basic. "0 to 7" covers only the acidic half, and "1 to 14" leaves out the strongest acids.',
  'As the pH of a solution falls from 7 towards 0, the concentration of hydrogen ions in it':
    'pH is a logarithmic measure of H+ concentration: each unit the pH falls multiplies the H+ concentration by **10**. Going from pH 7 to pH 0 is seven steps, so the concentration increases about ten million times - it **increases**. A very high concentration is never zero, so that option confuses "huge" with "nothing".',
  'Which of the following is a weak acid?':
    'Acetic acid (CH3COOH, the acid in vinegar) ionises only **partially** in water, so the solution holds many un-ionised molecules and few H+ ions - a weak acid. Hydrochloric, sulphuric and nitric acids are mineral acids that ionise almost completely and are strong.',
  'A strong acid is one that':
    'Strength is about **ionisation**, not about how many hydrogen atoms a formula contains: a strong acid releases almost all of its H+ ions in water, so it gives rise to **more hydrogen ions** at the same concentration. That is why its pH is lower, not higher, than a weak acid of the same concentration.',
  'Which colour change shows that a solution is acidic?':
    'Acids turn **blue litmus red**. Red litmus turning blue is the test for a base, and a colour that does not change tells you nothing - the test is the change itself.',
  'The products formed when hydrochloric acid reacts with sodium hydroxide are:':
    'An acid plus a base gives a **salt and water**: HCl + NaOH -> **NaCl + H2O**. Hydrogen gas comes from an acid reacting with a metal, so "sodium chloride and hydrogen" is the usual trap - no metal is involved here.',
  'A solution of pH 3 is:':
    'pH 3 is **below 7**, so the solution is acidic - the lower the number, the more H+ ions it contains. A basic solution sits above 7 and a neutral one is exactly 7.',
  'Which of these is a weak acid?':
    '**Acetic acid** is the weak acid here: it ionises only partly, so most of it stays as CH3COOH molecules and few H+ ions are released. Hydrochloric, nitric and sulphuric acids all ionise almost completely and are strong acids.',
  'Why does dry hydrogen chloride gas not change the colour of dry litmus paper?':
    'Acids show their acidic behaviour only **in water**: HCl gas has to dissolve and release H+ ions before it can act as an acid. Dry litmus paper contains no water for the gas to ionise in, so no H+ ions are formed and the colour does not change. The same gas turns **moist** litmus red.',
  'What colour change does blue litmus paper show in an acid?':
    'Acid turns **blue litmus red**. Red litmus turning blue is the test for a base, and turning colourless is what phenolphthalein does in acid - not litmus.',
  'In a neutralisation reaction an acid reacts with a base to give':
    'In neutralisation the H+ from the acid and the OH- from the base join to form **water**, and the leftover ions form a **salt** - HCl + NaOH -> NaCl + H2O. Hydrogen gas and carbon dioxide come from acid-metal and acid-carbonate reactions, not from an acid meeting a base.',
  'Which of the following is a non-metal?':
    '**Sulphur** is a non-metal: it is dull, brittle and a poor conductor of heat and electricity. Copper, aluminium and iron are all metals - shiny, malleable and good conductors.',
  'Which of the following metals is so soft that it can be easily cut with a knife?':
    '**Sodium** is soft enough to be cut with a knife, which is one of the reasons it cannot be left in the open. Copper, aluminium and iron are hard metals used for structure and wiring.',
  'Which allotrope of carbon is the hardest natural substance known?':
    'In **diamond** every carbon atom is bonded to four others in a rigid three-dimensional lattice, which makes it the hardest natural substance. Graphite, charcoal and coal are also carbon, but their layers are held weakly and they are soft and slippery.',
  'Which of the following metals is the most reactive?':
    'The reactivity series runs K > Na > Ca > Mg > Al > Zn > Fe > Pb > Cu > Ag > Au, so **potassium** is the most reactive of these four. Gold sits at the very bottom, which is why it is found uncombined in nature.',
  'For a metal to displace hydrogen from a dilute acid, the metal must be placed':
    'Only a metal **above hydrogen** in the activity series can push hydrogen out of an acid, because displacement needs the attacking metal to be more reactive. Copper, silver and gold sit below hydrogen and do not react with dilute acids at all.',
  'An iron nail is kept in copper sulphate solution for about twenty minutes. What is observed?':
    'Iron is more reactive than copper, so it **displaces copper**: a brownish coating of copper forms on the nail and the blue colour of the solution fades as iron(II) sulphate forms. The nail does not dissolve completely, and "iron is less reactive than copper" reverses the truth - that is why the reaction happens at all.',
  'Which of the following is a displacement reaction?':
    'In **Zn + CuSO4 -> ZnSO4 + Cu** zinc takes the place of copper in its salt, which is exactly what a displacement reaction is. CaCO3 -> CaO + CO2 is decomposition, NaOH + HCl is neutralisation, and CaO + H2O is combination.',
  'Which property is typical of most metals?':
    'Metals are **good conductors of heat and electricity** - that is why copper is used for wires and aluminium for pans. They are malleable and ductile rather than brittle, and most melt at high temperatures (mercury is the exception, not the rule).',
  'Which metal is soft enough to be cut with a knife?':
    '**Sodium** is soft and can be cut with a knife, which is part of why it must be stored under kerosene. Iron, copper and zinc are hard metals used for structure and tools.',
  'Which metal is placed highest in the reactivity series?':
    '**Potassium** heads the reactivity series (K > Na > Ca > Mg > Al > Zn > Fe ...), so it reacts most violently with water and air. Iron is in the middle, copper near the bottom and gold at the very bottom.',
  'Iron nails dipped in copper sulphate solution turn brown because:':
    'The brown coating is **copper metal** deposited on the nail: Fe + CuSO4 -> FeSO4 + Cu happens because iron is more reactive and displaces copper from its salt. Copper cannot displace iron, so the reverse never occurs, and the sulphate does not decompose on its own.',
  'Why is sodium stored immersed in kerosene?':
    'Sodium reacts vigorously with the **oxygen and moisture** in air, forming sodium hydroxide and even catching fire, so it is kept under kerosene to shut air and water out. The kerosene is a barrier, not a coolant.',
  'Which property allows copper to be drawn into wires?':
    '**Ductility** is the property of being drawn into a wire, and copper is the standard example because it is ductile and an excellent conductor. Brittleness is the opposite (it breaks instead of bending), and transparency and volatility describe other kinds of material.',
  'The general formula of alkanes is __.':
    'Alkanes are **saturated** - every carbon is joined by single bonds only - so the chain carries the maximum number of hydrogens: **CnH2n+2** (methane, CH4, is the n = 1 case). CnH2n is the alkene family and CnH2n-2 the alkynes, so those formulas describe unsaturated compounds.',
  'A covalent bond between two atoms is formed by':
    'A covalent bond is a **shared electron pair**: each atom contributes one electron and both nuclei are attracted to the pair, which holds the atoms together. Transferring electrons produces ions (ionic bonding), and two nuclei on their own would repel each other rather than bond.',
  'Why does carbon form compounds mainly by sharing electrons instead of gaining or losing them?':
    'Carbon has **four valence electrons** and needs four more, but gaining four would create a very high charge and losing four costs a great deal of energy - so **sharing** is the cheaper route. Carbon bonds with other carbon atoms all the time: that is what makes chains and rings possible.',
  'The molecular formula of cyclohexane is':
    'Cyclohexane is **six carbons in a ring joined by single bonds**, so each carbon still carries two hydrogens: **C6H12**. C6H6 is benzene (with three double bonds) and C6H14 is the straight-chain hexane, which has two extra hydrogens at the ends.',
  'Compounds that have the same molecular formula but different structures are called':
    '**Structural isomers** have the same molecular formula but a different arrangement of atoms - butane and 2-methylpropane are the classic pair. Isotopes differ inside the nucleus, allotropes are different forms of one element, and homologues differ by a CH2 unit, not by structure.',
  'Which functional group is present in ethanol?':
    'Ethanol is CH3CH2OH, so its functional group is the **alcohol (-OH)**. A ketone is a -CO- inside the chain, an aldehyde is -CHO at the end, and a carboxylic acid is -COOH - each is a different family with different reactions.',
  'The name of an aldehyde is formed by adding which suffix to the name of the carbon chain?':
    'Aldehydes take the suffix **-al** (ethane -> ethanal). Alcohols take -ol, ketones -one and carboxylic acids -oic acid, so the suffix is what tells you which functional group the molecule carries.',
  'A covalent bond is formed by:':
    'A covalent bond is the **sharing of an electron pair** between two atoms. Transferring electrons gives ions instead, and two positive nuclei alone would repel each other - attraction between nuclei is the opposite of what holds a molecule together.',
  'How many covalent bonds are present in one methane molecule?':
    'Methane is CH4, so carbon shares its **four** valence electrons with four hydrogen atoms, giving four C-H single bonds in a tetrahedral shape. Carbon needs four bonds to complete its octet, so two, three or one would leave it short.',
  'The functional group present in ethanol is:':
    '**-OH** is the alcohol group and ethanol (C2H5OH) carries it. -CHO is an aldehyde, -COOH a carboxylic acid and -CO- a ketone, so each option is a different family.',
  'Which of these is a saturated hydrocarbon?':
    'A **saturated** hydrocarbon has only single bonds, and **ethane** (C2H6) is one. Ethene has a double bond, ethyne a triple bond, and benzene a ring of delocalised double bonds - all three are unsaturated.',
  'Why does carbon form compounds mainly by covalent bonding?':
    'Carbon has **four valence electrons**: losing four would take far too much energy and gaining four would give a highly charged ion, so it **shares** electrons and forms covalent bonds. That is also why most carbon compounds are molecular rather than ionic.',
  'Which of these is an unsaturated hydrocarbon?':
    '**Ethene** (C2H4) contains a carbon-carbon double bond, which is what "unsaturated" means. Methane, ethane and propane have only single bonds and are saturated.',
  'Name the organ where urea is formed in the human body.':
    'Urea is formed in the **liver**, when excess amino acids are broken down (deamination) and their nitrogen is converted into urea. The kidneys then filter urea out of the blood and excrete it in urine - the liver makes it and the kidneys remove it.',
  'Which of the following is an autotroph?':
    'An **autotroph** makes its own food from sunlight, water and CO2, and a green plant does exactly that. A mushroom is a saprophyte living on dead matter, Cuscuta is a parasite drawing food from its host, and a human is a heterotroph.',
  'In a plant, the carbohydrate made during photosynthesis that is not used immediately is stored as':
    'Glucose not used at once is stored as **starch** - insoluble, compact and easily broken back into glucose when the plant needs energy. Glycogen is the animal storage form, cellulose is structural, and protein is built from amino acids rather than sugar.',
  'Which chamber of the human heart pumps oxygen-rich blood out to the rest of the body?':
    'The **left ventricle** has the thickest muscular wall because it pushes oxygen-rich blood into the aorta and around the whole body. The right ventricle pumps only to the nearby lungs, and the atria receive blood rather than pumping it out.',
  'Why is the separation of the right side and the left side of the human heart useful?':
    'Separate sides **stop oxygenated and deoxygenated blood from mixing**, so the body receives blood carrying the maximum amount of oxygen. Mixing would lower oxygen delivery; four-chambered hearts belong to animals with high energy needs precisely because they keep the two streams apart.',
  'Which blood vessels have thick, elastic walls because the blood inside them is under high pressure?':
    '**Arteries** carry blood away from the heart under the full pressure of each contraction, so their walls are thick, elastic and muscular to stretch and recoil. Veins are low-pressure and thin-walled, and capillaries are a single cell thick.',
  'Exchange of materials between the blood and the surrounding cells takes place across the walls of':
    '**Capillaries** are only one cell thick, which is what lets materials diffuse between the blood and the surrounding cells. Arteries and veins are too thick-walled for exchange, and heart chambers never touch body cells.',
  'Organisms that prepare their own food using sunlight are called:':
    '**Autotrophs** prepare their own food from sunlight (and water and CO2). Heterotrophs depend on others for food, saprophytes feed on dead matter, and parasites feed on a living host.',
  'In humans, the digestion of starch begins in the:':
    'Starch digestion begins in the **mouth**, where salivary amylase breaks it into maltose while the food is chewed. The stomach is acidic and stops amylase working, and the small intestine finishes the job with pancreatic amylase.',
  'Which blood vessel carries oxygenated blood from the lungs to the heart?':
    'The **pulmonary vein** brings oxygenated blood from the lungs to the left atrium - the one vein that carries oxygen-rich blood. The pulmonary artery carries deoxygenated blood to the lungs, the vena cava returns blood from the body and the aorta leaves the heart.',
  'Blood vessels with thick elastic walls that carry blood away from the heart are:':
    '**Arteries** carry blood away from the heart and take the pressure of every contraction, so their walls are thick, elastic and muscular. Veins return blood at low pressure and have valves, and capillaries are one cell thick.',
  'State the function of the diaphragm during breathing.':
    'During **inhalation** the diaphragm contracts and flattens and the ribs lift, so the chest cavity gets bigger, the pressure inside falls and air rushes in. During **exhalation** it relaxes, the cavity shrinks and air is pushed out.',
  'Where is bile produced, and what does it do?':
    '**Bile is produced in the liver** (stored in the gall bladder) and released into the small intestine, where it **emulsifies fats** - breaking large droplets into smaller ones so lipase can digest them. Bile itself contains no enzymes.',
  'Which part of the brain controls voluntary actions?':
    'The **cerebrum**, the large forebrain, is the seat of thinking, memory and voluntary movement. The cerebellum controls balance and precision, the medulla controls involuntary actions such as breathing and heartbeat, and the pons relays signals.',
  'In the human body, reflex arcs are formed in the':
    'Reflex arcs are formed in the **spinal cord**, which can send a stimulus straight to a motor neuron without waiting for the brain. The medulla and cerebellum are parts of the brain, so a response routed through them is slower.',
  'What is the advantage of a reflex arc over a response that involves thinking?':
    'A reflex arc **completes the response quickly**, because the signal is routed through the spinal cord instead of travelling to the brain for a decision. Speed is the whole point - a hand leaves a hot pan before the pain is consciously felt.',
  'Which endocrine gland produces insulin?':
    '**Insulin** is made by the beta cells of the **pancreas**. The thyroid makes thyroxin, the adrenal glands make adrenaline and cortisol, and the pituitary makes growth hormone and controls the other glands.',
  'Iodine in the diet is necessary for the synthesis of which hormone?':
    '**Thyroxin** cannot be made without iodine, which is why iodised salt matters and why a deficiency causes goitre. Insulin is a protein, adrenaline comes from an amino acid, and testosterone is a steroid - none of them needs iodine.',
  'When the sugar level in the blood rises, the cells of the pancreas produce more insulin, and when the sugar level falls, insulin secretion is reduced. This is an example of':
    'This is a **feedback mechanism**: the response (insulin) reduces the original stimulus (high glucose), which then reduces the response. It holds the level steady instead of letting it run away - the same design as a thermostat.',
  'The junction between two neurons across which an impulse passes is called a:':
    'The **synapse** is the junction where one neuron ends and the next begins, and the impulse crosses it as a chemical signal. Dendrites receive the signal, axons carry it away, and the myelin sheath insulates the axon to speed transmission.',
  'The correct sequence of a reflex arc is:':
    'The path is **receptor -> sensory neuron -> spinal cord -> motor neuron -> effector**. Any order that puts the effector first or the brain in the middle describes a voluntary action rather than a reflex.',
  'Which gland secretes insulin?':
    '**Insulin** comes from the pancreas, specifically the beta cells in its islets of Langerhans. The adrenal gland makes adrenaline, the pituitary growth hormone, and the thyroid thyroxin.',
  'A rise in blood glucose after a meal is brought back to normal mainly by:':
    '**Insulin from the pancreas** moves glucose into cells and encourages the liver to store it as glycogen, bringing the level back down. Adrenaline and thyroxine raise blood glucose; they do not lower it.',
  'What is the role of the spinal cord in a reflex action?':
    'The **spinal cord** routes the impulse from the sensory neuron straight to the motor neuron, so the reflex is completed without waiting for the brain. The brain is still informed afterwards - it is just not in the loop that fires the muscle.',
  'Which part of a neuron receives the message from another neuron?':
    'The **dendrite** receives the signal and passes it to the cell body; the axon carries it away to the next neuron. The synaptic gap is the space between two neurons and the myelin sheath insulates the axon.',
  'What kind of feedback keeps the level of a hormone steady in the blood?':
    '**Negative feedback** keeps a hormone steady: a rise triggers a response that lowers it, and the fall then switches the response off. Positive feedback would push the level further away from normal, which is not how hormone levels are held in balance.',
  'In which unicellular organism does binary fission occur in a definite orientation because of a whip-like structure at one end of the cell?':
    '**Leishmania** has a whip-like flagellum at one end, so it divides along a **fixed axis**. Amoeba divides in any plane, yeast reproduces by budding, and Plasmodium divides into many cells at once (multiple fission).',
  'In which of the following does a bud develop as an outgrowth at one specific site due to repeated cell division, and then detach to become a new individual?':
    'In **Hydra** a bud grows at one particular point, develops tentacles and then detaches to live on its own. Spirogyra reproduces by fragmentation, Planaria by regeneration, and Rhizopus by spores.',
  'In a field of pumpkin, flowers left open and visited by bees set fruit, while flowers covered with a fine net do not. What is the best explanation?':
    'The net **kept the pollinating agents away**, so no pollen reached the stigma and fertilisation never happened - and without fertilisation there is no fruit. The open flowers are the control that proves it: the only difference was the bees, not light or petals.',
  'Name the four parts of a flower and state which two are the reproductive parts. Also name the three parts of the pistil.':
    'A flower has **sepals, petals, stamens and a pistil**. The **stamen** (anther + filament) is the male part and the **pistil** (ovary + style + stigma) is the female part. Sepals and petals are accessory parts that protect the bud and attract pollinators.',
  'Binary fission is commonly seen in:':
    '**Amoeba** reproduces by binary fission: the nucleus divides, the cytoplasm constricts, and one cell becomes two identical daughter cells. Yeast and Hydra bud, and Spirogyra reproduces by fragmentation.',
  'Budding is the mode of reproduction in:':
    '**Yeast** reproduces by budding: a small outgrowth forms, a nucleus moves into it, and it pinches off as a new cell. Planaria regenerates, Amoeba divides in two and Plasmodium multiplies inside a host.',
  'The male reproductive part of a flower is the:':
    'The **stamen** is the male part: its anther produces pollen grains that carry the male gametes. The carpel (pistil) is the female part, and sepals and petals are protective and attractive rather than reproductive.',
  'Transfer of pollen from the anther to the stigma of the same flower is called:':
    'Pollen moving from the anther to the stigma of the **same flower** is **self-pollination**. Cross-pollination involves a different plant, fertilisation is the fusion of gametes that follows pollination, and germination is a seed sprouting.',
  'State the function of the placenta in human reproduction.':
    'The **placenta** links the embryo to the mother and lets **nutrients and oxygen diffuse in and waste diffuse out**, with the two blood supplies never mixing. It does the work of the lungs, gut and kidneys until birth.',
  'In binary fission, one parent cell divides into':
    'In binary fission one parent cell divides into **two daughter cells**, each a copy of the parent. Four cells at once is multiple fission (Plasmodium), and budding produces small outgrowths rather than equal halves.',
  'Which organism reproduces by budding?':
    '**Yeast** reproduces by budding: an outgrowth grows, receives a nucleus and pinches off. Amoeba divides in two, Spirogyra fragments, and Bryophyllum grows plantlets on the margins of its leaves.',
  'Which part of a flower produces the pollen grains?':
    'The **anther** - the upper part of the stamen - produces the pollen grains. The stigma receives them, the ovary holds the ovules, and the sepal protects the bud.',
  'What is the genotype of a tall plant (T) if it is heterozygous?':
    '**Tt**. The plant is tall, so it must carry at least one dominant T; heterozygous means the two alleles differ, so the other is the recessive t. TT would be homozygous tall and tt would be short.',
  'In a cross between two heterozygous tall pea plants (Tt × Tt), what fraction of the offspring is expected to be short?':
    'A Tt x Tt cross gives TT : Tt : tt in a **1 : 2 : 1** ratio, so **one quarter** of the offspring are tt and short. The other three quarters are tall - the classic 3 : 1 ratio Mendel observed.',
  'A tall pea plant of genotype TT is crossed with a short pea plant of genotype tt. The F1 progeny will be':
    'Every gamete from TT carries T and every gamete from tt carries t, so all the F1 are **Tt and tall** - the recessive allele is present but hidden. Short plants can only reappear when the F1 are crossed with each other.',
  'According to the idea of natural selection, the individuals that survive and reproduce are those that':
    'Natural selection keeps the individuals **better suited to their surroundings**, because they are the ones that survive to reproduce and pass those variations on. Having many offspring is not enough if they do not survive, and size or age alone is not an advantage.',
  'A new species is said to have arisen when':
    'A new species has arisen when two populations become **reproductively isolated** - so different that they can no longer interbreed and produce fertile offspring. Growing larger in one lifetime, or simply moving habitat, does not create a species.',
  "In Mendel's pea experiments, the trait that appeared in the F1 generation is called:":
    'The trait that shows in the **F1** is the **dominant** one; the recessive allele is still there but hidden, and it reappears in the F2. A mutation is a change in DNA and an acquired character is a change during life - neither is what Mendel was describing.',
  'A cross between TT and tt pea plants produces F1 offspring that are:':
    'All the F1 are **tall**, because each plant inherits T from one parent and t from the other and every plant is Tt. The 3 : 1 ratio only appears when those Tt plants are crossed with each other.',
  'According to Darwin, evolution takes place mainly through:':
    "Darwin's mechanism is **natural selection acting on favourable variations**: inherited differences that help survival become more common over generations. Use and disuse with inheritance of acquired characters was Lamarck's idea, and species do not appear suddenly.",
  'Reproductive isolation between two populations of the same species can lead to:':
    '**Reproductive isolation** lets two populations of one species drift apart until they can no longer interbreed - that is **speciation**. Without isolation, gene flow keeps them a single species.',
  'How is the sex of a human child determined?':
    "The **father's sperm** decides it: an X-bearing sperm gives XX (a girl) and a Y-bearing sperm gives XY (a boy). The mother always contributes an X, so she cannot determine the child's sex.",
  'Natural selection favours individuals that':
    'Natural selection favours individuals **better adapted to their surroundings**, because they survive and reproduce. Having the fewest offspring, being the largest, or living briefly are not advantages in themselves.',
  'Speciation happens when populations are separated and':
    'Once separated populations **can no longer interbreed to produce fertile offspring**, they are separate species. Growing larger, sharing a habitat or eating the same food does not by itself make a new species.',
  'The angle of incidence is equal to the angle of __.':
    'The law of reflection says the **angle of incidence equals the angle of reflection**, both measured from the normal. Refraction is the bending at a boundary between media, and deviation is the angle between the incident and emergent rays.',
  'A concave mirror forms a real, inverted and diminished image of an object when the object is placed':
    'Beyond the centre of curvature a concave mirror gives a **real, inverted and diminished** image between F and C. At C the image is the same size, between C and F it is enlarged, and inside F it becomes virtual and erect.',
  'An object is placed between the pole and the principal focus of a concave mirror. The image formed is':
    'Inside the focus the reflected rays diverge, so the image is **virtual, erect and enlarged** - the shaving-mirror case. A real image cannot be formed when the object is nearer than the focal length.',
  "For a given pair of media and a given colour of light, the ratio of the sine of the angle of incidence to the sine of the angle of refraction is":
    "For a given pair of media and colour, sin i / sin r is **a constant** - the refractive index. It is greater than one going from a rarer to a denser medium, less than one the other way, and being a ratio it has no units.",
  'A ray of light travelling obliquely from a denser medium into a rarer medium':
    'Going from denser to rarer light speeds up and **bends away from the normal**. Bending towards the normal happens on the way in, and passing undeviated only happens when the ray travels along the normal itself.',
  'Whatever the position of the object, a concave lens always forms an image that is':
    'A concave lens diverges light, so whatever the object position the image is **virtual, erect and diminished**. A diverging lens cannot form a real image of a real object.',
  'The power of a convex lens of focal length 50 cm is':
    'P = 1/f with the focal length in **metres**: 1/0.5 = **+2.0 D**. A convex lens has positive power, so -2.0 D would be a concave lens of the same focal length, and +50 D forgets to convert centimetres.',
  'According to the laws of reflection, the angle of incidence is always equal to the:':
    'The law of reflection states that the **angle of incidence equals the angle of reflection**. The angle of refraction belongs to Snell\u2019s law, deviation is the total bend, and the critical angle is the threshold for total internal reflection.',
  'A concave mirror forms a real and inverted image when the object is placed:':
    'A concave mirror gives a **real, inverted** image whenever the object is **beyond its focus**. Between the pole and the focus the image is virtual and erect, so "only at the centre of curvature" is far too narrow.',
  'Light bends when it enters a new medium because its:':
    'Light bends because its **speed changes** in the new medium, and that change tilts the wavefront. Colour and amplitude do not explain it, and frequency stays the same across a boundary - only speed (and therefore wavelength) changes.',
  'A convex lens is also called a:':
    'A convex lens is a **converging** lens: it brings parallel rays to a focus on the other side. A concave lens diverges, and a plane sheet does not focus light at all.',
  'State two differences between the image formed by a plane mirror and by a concave mirror when the object is beyond the focus.':
    'A **plane mirror** gives a **virtual, erect image of the same size** as the object. A **concave mirror** with the object beyond its focus gives a **real, inverted image**, diminished when the object is beyond C and enlarged when it is between C and F.',
  'The least distance of distinct vision for a normal eye is __.':
    'The **least distance of distinct vision** (the near point) for a normal adult eye is about **25 cm** - closer than that the eye cannot focus sharply. The near point moves further away with age as the lens loses its ability to accommodate.',
  'What kind of image does the eye lens form on the retina?':
    'The eye lens is a **convex** lens, so it forms a **real, inverted** image on the retina. The brain interprets it the right way up; a virtual image could not be formed on the retina at all, since it cannot be projected onto a surface.',
  'Most of the refraction of light rays entering the human eye takes place at the':
    'Most of the bending happens at the **outer surface of the cornea**, where light passes from air into a curved, denser medium. The crystalline lens then makes the fine adjustment needed to focus on near or far objects.',
  'When white light is passed through a glass prism, which colour of the spectrum bends the most?':
    '**Violet** has the shortest wavelength and the highest refractive index in glass, so it bends the most; red bends least. That is why violet is on the inner edge of a prism spectrum and red on the outer.',
  'The band of coloured components of a light beam is called its':
    'The band of colours is the **spectrum**; the splitting itself is **dispersion**. Deviation is the angle through which the light is bent and the angle of emergence is where it leaves the prism, so neither names the band.',
  'Which sequence correctly describes what sunlight undergoes inside a raindrop to produce a rainbow?':
    'Inside a raindrop sunlight is first **refracted and dispersed** at the surface (the colours separate), then **internally reflected** from the far side, then **refracted again** as it leaves. Dispersion before the reflection is what spreads the colours into an arc.',
  'The image formed on the retina of a normal human eye is:':
    'The retina is the screen, and a convex lens forms a **real, inverted** image on it. The brain turns it the right way up; the image on the retina itself is inverted.',
  'Myopia is corrected by using a:':
    'Short-sightedness (myopia) focuses light in front of the retina, so a **concave (diverging) lens** spreads the rays slightly and moves the focus back onto the retina. A convex lens would push the focus further forward.',
  'The splitting of white light into its component colours by a prism is called:':
    'Splitting white light into its colours is **dispersion**, caused by each colour having a slightly different refractive index. Diffraction is bending around an obstacle, reflection is bouncing, and scattering is random redirection by particles.',
  'A rainbow is produced by sunlight because of:':
    'A rainbow comes from **refraction, dispersion and internal reflection inside water droplets** - each droplet acts like a tiny prism. Scattering by dust, reflection from the ground or absorption of red light cannot produce an ordered arc of colours.',
  'Why do stars twinkle while planets do not?':
    'A star is so far away that it acts as a **point source**: the atmosphere keeps bending its light, so its brightness flickers. A planet is close enough to appear as a small disc, and the flickering of all its points averages out, so it shines steadily.',
  'Which lens corrects myopia (short-sightedness)?':
    'A **concave lens**: myopia focuses light in front of the retina, and a diverging lens pushes the image back onto it. A convex lens corrects long-sightedness and a cylindrical lens corrects astigmatism.',
  'A rainbow is formed mainly by which two processes in raindrops?':
    'The two essential processes are **refraction (with dispersion) and total internal reflection** inside the raindrop. Reflection alone, absorption or scattering cannot separate white light into an ordered band.',
  'The SI unit of electric current is __.':
    'The SI unit of current is the **ampere (A)**: one coulomb of charge per second. The volt measures potential difference, the ohm resistance and the watt power.',
  "State Ohm's law and write its mathematical form.":
    "**Ohm's law**: at constant temperature the **current through a conductor is directly proportional to the potential difference** across it, so **V = IR**. R is the resistance in ohms.",
  'The SI unit of electrical resistivity is':
    'Resistivity is resistance x area / length, so its unit is the **ohm metre (Ω m)** - ohms multiplied by square metres, divided by metres. The ohm and V/A are units of resistance, not resistivity.',
  'On what does the electrical resistivity of a metallic conductor depend?':
    'Resistivity depends on the **material and its temperature**, not on the size of the piece: two wires of the same metal have the same resistivity even with different lengths and thicknesses. Length and area change the resistance, not the resistivity.',
  "According to Joule's law of heating, the heat produced in a resistor for a given resistance is directly proportional to":
    'Joule\u2019s law gives H = I²Rt, so for a fixed resistance and time the heat is proportional to the **square of the current** - doubling the current quadruples the heat. The current itself, or its square root, would get the scaling wrong.',
  'A current of 2 A flows through a resistor of 5 Ω for 10 s. The heat produced in the resistor is':
    'H = I²Rt = 2² x 5 x 10 = **200 J**. Using I instead of I² gives 100 J, and forgetting the factor of time gives 20 J - the squared term is the one to watch.',
  'One kilowatt hour is equal to':
    'One kilowatt hour is 1000 W x 3600 s = **3.6 x 10⁶ J**. 3.6 x 10³ J is a thousand times too small, and 1.0 x 10³ J is one watt for about a quarter of an hour.',
  'A 100 W electric bulb is used for 10 hours. The electrical energy consumed by it is':
    'Energy = power x time = 0.1 kW x 10 h = **1 kW h**, which is one unit on an electricity bill. Dividing instead of multiplying gives 10 kW h, and skipping the kilowatt conversion gives 100.',
  "Ohm's law states that the potential difference across a conductor is directly proportional to the current when:":
    "Ohm's law holds **when the temperature stays constant** - a hot filament does not obey it, which is why a bulb\u2019s V-I graph curves. A special current value or a zero resistance is not the condition.",
  'The SI unit of resistivity is:':
    'The unit is the **ohm metre**: resistivity = resistance x area / length, so ohms times square metres over metres. Plain ohm is the unit of resistance.',
  'A 100 W bulb left on for 10 hours consumes electrical energy equal to:':
    '0.1 kW x 10 h = **1 kW h** - exactly one unit. 10 kW h would be a 1000 W appliance for ten hours, and 100 kW h is ten times too large again.',
  'One kilowatt hour is equal to:':
    '1 kW h = 1000 W x 3600 s = **3.6 x 10⁶ J**. 3.6 x 10³ J is a thousand times smaller, and 4.2 J is the heat needed to warm one gram of water by one degree.',
  'Why is the filament of an electric bulb made of tungsten and kept very thin?':
    '**Tungsten** has a very high melting point, so it can glow white-hot without melting; a **thin** wire has a high resistance, so the same current produces a lot of heat there. That is why the filament glows while the connecting wires stay cool.',
  'The magnetic field around a straight current-carrying conductor is __.':
    'The field forms **concentric circles** in a plane perpendicular to the wire, and they spread further apart as the distance from the wire increases because the field weakens. Each circle stays in its own plane, so it is not a spiral.',
  'A straight current-carrying conductor is held in the right hand so that the thumb points along the direction of the current. The direction of the magnetic field lines around the conductor is then given by':
    'Hold the wire in the right hand with the **thumb along the current**: the **curled fingers** then show the direction of the field lines. The thumb gives the current, not the field - that is the usual mix-up.',
  "According to Faraday's law, a current is induced in a coil when":
    "A current is induced when the **magnetic field linked with the coil changes** - by moving a magnet, moving the coil, or changing the current in a nearby coil. A stationary coil in a steady field has no change, so no current flows.",
  'An electric generator is a device that converts':
    'A generator converts **mechanical energy into electrical energy** by moving a coil in a magnetic field. A motor does the opposite, and a cell converts chemical energy into electrical energy.',
  'Outside a bar magnet, the magnetic field lines run:':
    'Outside a magnet the lines run from the **north pole to the south pole**; inside, they run from south to north to close the loop. Field lines never cross one another.',
  'The right-hand thumb rule gives the direction of the:':
    'The rule gives the **direction of the magnetic field around a current-carrying conductor**. Fleming\u2019s left-hand rule gives the force on a conductor and Fleming\u2019s right-hand rule gives the induced current.',
  'A current is induced in a coil when:':
    'Induction needs a **change in the magnetic flux** through the coil. Being made of copper, being connected to a battery, or sitting still inside a strong magnet produces no change - and a steady field induces nothing.',
  'An electric generator converts:':
    'A generator turns **mechanical energy into electrical energy**. A motor turns electrical into mechanical, a cell turns chemical into electrical, and a heater turns electrical into heat.',
  'State the rule used to find the direction of the force acting on a current-carrying conductor placed in a magnetic field.':
    '**Fleming\u2019s left-hand rule**: hold the thumb, forefinger and middle finger mutually perpendicular; the **forefinger points along the field, the middle finger along the current, and the thumb gives the force** (motion).',
  'The right-hand thumb rule gives the direction of':
    'It gives the **direction of the magnetic field around a current-carrying wire**. The current is what you put into the rule, not what it produces.',
  'An electric generator converts':
    '**Mechanical energy into electrical energy**: the coil is turned by an external agency and the changing flux induces a current. The other way round is a motor.',
  'The direction of the induced current is given by':
    '**Lenz\u2019s law**: the induced current flows so as to oppose the change that produced it, which is a consequence of energy conservation. The right-hand thumb rule gives a field direction, and Ohm\u2019s law relates V, I and R.',
  'What is the role of decomposers in an ecosystem?':
    '**Decomposers** (bacteria and fungi) break down dead organisms and waste, releasing nutrients back into the soil so producers can use them again. Without them, matter would pile up as dead material and the cycle would stop.',
  'In the carbon cycle, carbon returns to the atmosphere mainly through':
    'Carbon returns to the atmosphere through **respiration and decomposition**, which release CO2. Photosynthesis removes it, nitrogen fixation belongs to the nitrogen cycle, and transpiration moves water.',
  'Which process converts atmospheric nitrogen into soluble nitrates that plants can absorb?':
    '**Nitrogen fixation** turns atmospheric N2 into soluble nitrates - by Rhizobium in root nodules, by free-living bacteria, and by lightning. Denitrification goes the other way and ammonification releases ammonia from dead matter.',
  'The decrease in the amount of ozone in the atmosphere is mainly linked to':
    '**Chlorofluorocarbons (CFCs)**, once used in refrigerators and spray cans, release chlorine in the stratosphere that destroys ozone. CO2 and methane cause warming instead, and dust and water vapour do not deplete ozone.',
  "Depletion of the ozone layer is harmful mainly because it allows more":
    'Ozone absorbs **ultraviolet radiation**; with less ozone more UV reaches the surface, causing skin cancer, cataracts and damage to crops and plankton. Oxygen escaping or CO2 being absorbed is not what the ozone layer prevents.',
  'Which pair of gases is chiefly responsible for trapping heat in the atmosphere and causing global warming?':
    '**Carbon dioxide and methane** are the main greenhouse gases from human activity: they absorb infrared radiation and re-emit it downwards. Neon, krypton, helium and argon are noble gases and trap no heat.',
  "A rise in the average temperature of the earth is expected to cause":
    'Warming melts polar ice and makes ocean water expand, so **sea level rises** and low-lying coasts flood more often. Falling sea levels, fewer floods and a cooler surface are the opposite of what warming does.',
  'In a grassland food chain, green plants are:':
    'Green plants are **producers**: they make their own food by photosynthesis and start every food chain. Primary consumers eat them, top consumers eat those, and decomposers break down what dies.',
  'The carbon cycle mainly moves carbon between:':
    'The carbon cycle moves carbon between the **atmosphere, living organisms, soil and oceans** through photosynthesis, respiration, decomposition, combustion and dissolving. It is not limited to plants and animals.',
  'The ozone layer in the stratosphere protects life on earth from:':
    'The ozone layer absorbs **ultraviolet radiation**, which damages DNA and causes skin cancer and cataracts. Visible light and infrared pass through it, and cosmic dust is a different problem.',
  'The main greenhouse gas released by burning fossil fuels is:':
    '**Carbon dioxide** is the main greenhouse gas from burning coal, oil and gas, because it absorbs infrared radiation. Nitrogen and oxygen do not absorb infrared and helium is inert.',
  'Why are decomposers essential in an ecosystem?':
    'They **break down dead plants and animals and return the nutrients to the soil**, so producers can take them up again and matter keeps cycling. Without them, nutrients would stay locked inside dead matter.',
  'HCF of 12 and 18 is __.':
    '12 = 2² x 3 and 18 = 2 x 3², so the HCF takes the **lowest power of each common prime**: 2 x 3 = **6**. 2 and 3 are common factors but not the greatest, and 36 is the LCM rather than the HCF.',
  'The HCF of two positive integers is 6 and their LCM is 72. If one of the integers is 24, what is the other integer?':
    'HCF x LCM = product of the two numbers, so 6 x 72 = 432 and 432 / 24 = **18**. Check: HCF(18, 24) = 6 and LCM(18, 24) = 72. Choosing 12 would make the HCF 12, not 6.',
  'Two bells ring at intervals of 18 minutes and 24 minutes. If they ring together at 9:00 a.m., after how many minutes will they next ring together?':
    'They meet again after the **LCM** of 18 and 24: 18 = 2 x 3² and 24 = 2³ x 3, so LCM = 2³ x 3² = **72 minutes**. 36 is not a multiple of 24, and 6 is the HCF - the greatest common divisor, not the next meeting.',
  'Which of the following rational numbers has a terminating decimal expansion?':
    'A fraction terminates only when its denominator in lowest terms has **no prime factor other than 2 and 5**. 80 = 2⁴ x 5, so 7/80 terminates; 14 and 28 bring in a factor of 7 and 12 brings in 3, so those three repeat forever.',
  'The decimal expansion of 13/125 terminates after how many decimal places?':
    '125 = 5³, and multiplying by 2³/2³ gives a denominator of 1000, so the decimal has **3 places**: 13/125 = 0.104. The exponent of the 2 or 5 in the denominator is exactly the number of places.',
  'In the proof that the square root of a prime p is irrational, the key theorem used is that if p divides a squared, then:':
    'The proof uses: **if a prime p divides a², then p divides a**. That forces p to divide a, and then p² divides a², which is what contradicts the assumption. p² dividing a is far too strong - it is not the tool being used.',
  'The HCF of 96 and 404 is:':
    '96 = 2⁵ x 3 and 404 = 2² x 101, so the shared part is **2² = 4**. 8 and 12 do not divide 404, and 2 is a common factor but not the greatest one.',
  'The LCM of 6 and 20 is:':
    '6 = 2 x 3 and 20 = 2² x 5, so the LCM takes the **highest power of each prime**: 2² x 3 x 5 = **60**. 30 is not a multiple of 20, 40 is not a multiple of 6, and 120 is a common multiple but not the least.',
  'The decimal expansion of 13/3125 is:':
    '3125 = 5⁵, and 5 is the only prime factor of the denominator, so the decimal **terminates** (after 5 places). A prime factor other than 2 or 5 anywhere in the denominator is what makes a decimal repeat.',
  'Which of these numbers is irrational?':
    '**√2** is irrational - it cannot be written as a fraction of integers. 3/5 and 0.25 (= 1/4) are rational, and √16 = 4 is an integer, so all three of those are rational.',
  'Find the HCF and the LCM of 26 and 91.':
    '26 = 2 x 13 and 91 = 7 x 13, so the **HCF = 13** and the **LCM = 2 x 7 x 13 = 182**. The check is HCF x LCM = 13 x 182 = 2366 = 26 x 91.',
  'The standard method to prove that the square root of 2 is irrational is':
    '**Proof by contradiction**: assume √2 = p/q in lowest terms, square both sides, and show that p and q must both be even - which contradicts "lowest terms". Induction, construction and substitution are different proof techniques.',
  'A polynomial of degree 2 is called __.':
    'A degree-2 polynomial is **quadratic** (ax² + bx + c). Degree 1 is linear, degree 0 is constant and degree 3 is cubic - the degree is the highest power of x.',
  'The graph of the polynomial y = p(x) cuts the x-axis at exactly two distinct points. How many zeroes does p(x) have?':
    'Every point where the graph **cuts the x-axis** is a zero, so two crossings mean **two zeroes**. Three crossings would mean three, and no crossing would mean no real zero.',
  'When a polynomial p(x) is divided by a non-zero polynomial g(x), the remainder r(x) must satisfy:':
    'The remainder must have **degree less than the divisor** (or be zero); otherwise the division is not finished and you could divide further. Equal or greater degree means there is another term of the quotient.',
  'When p(x) = x^3 + 2x^2 - x + 4 is divided by x - 1, the quotient is x^2 + 3x + 2. What is the remainder?':
    'p(1) = 1 + 2 - 1 + 4 = **6**, and the remainder theorem says the remainder on dividing by (x - 1) is p(1). Multiplying back, (x - 1)(x² + 3x + 2) = x³ + 2x² - x - 2, leaving 6 over.',
  'The remainder when p(x) = x^3 - 4x^2 + 5x - 2 is divided by x - 2 is:':
    'The remainder is p(2) = 8 - 16 + 10 - 2 = **0**, so (x - 2) is a factor and 2 is a zero. A remainder of zero is the factor theorem in action.',
  'If the polynomial p(x) = 2x^3 + ax^2 - 3x + 5 leaves a remainder 7 when divided by x - 1, then a equals:':
    'p(1) = 2 + a - 3 + 5 = a + 4, and that must equal 7, so **a = 3**. Substituting x = -1 would give a different equation - the divisor is (x - 1), so the value to use is 1.',
  'The degree of the polynomial 4x^3 - 2x + 7 is:':
    'The degree is the **highest power of x** with a non-zero coefficient, which is 3. The 2 and the 7 are just coefficients and the constant term.',
  'The zeroes of a polynomial are the points where its graph:':
    'A zero is where p(x) = 0, so the graph **cuts the x-axis**. Cutting the y-axis gives the constant term, and passing through the origin means one particular zero, not what a zero is in general.',
  'On dividing x^2 + 3x + 5 by x + 1, the remainder is:':
    'The remainder is p(-1) = 1 - 3 + 5 = **3**. Dividing out gives (x + 1)(x + 2) + 3, which shows the 3 left over.',
  'The remainder when x^3 - 3x^2 + 2x - 1 is divided by x - 2 is:':
    'p(2) = 8 - 12 + 4 - 1 = **-1**. A negative remainder is perfectly normal - it just means the quotient overshoots by 1.',
  'Find the zeroes of x^2 - 7x + 12.':
    'Factorise: x² - 7x + 12 = (x - 3)(x - 4), so the zeroes are **3 and 4**. Check with the coefficients: sum = 7 = -b/a and product = 12 = c/a.',
  'What is the degree of the polynomial 4x^3 - 2x + 7?':
    'The **highest power of x** is 3, so the degree is 3 regardless of the other terms. Adding a constant never changes the degree.',
  'The graph of a quadratic polynomial is a':
    'The graph of a quadratic is a **parabola** - a U shape opening up when a > 0 and down when a < 0. A straight line is linear, while circles and hyperbolas come from other kinds of relation.',
  'Solve: x + y = 5 and x - y = 1':
    'Add the two equations and y cancels: 2x = 6, so **x = 3**, and substituting back gives **y = 2**. Adding works because the y coefficients are +1 and -1.',
  'The pair of equations 3x - 2y = 5 and 6x - 4y = 9 represents:':
    'Here a1/a2 = b1/b2 = 1/2 but c1/c2 = 5/9, so the lines are **parallel and have no solution**. Coincident lines would need all three ratios equal.',
  'For what value of k do the lines 4x + 6y = 12 and kx + 9y = 18 coincide?':
    'Coincident lines need a1/a2 = b1/b2 = c1/c2. Since 6/9 = 2/3 and 12/18 = 2/3, we need 4/k = 2/3, so **k = 6**. Choosing 9 or 12 breaks the equality.',
  'Using the cross-multiplication method, the solution of the pair x + 2y = 5 and 3x - y = 1 is:':
    'Substitute to check: 1 + 2(2) = 5 and 3(1) - 2 = 1, so **x = 1, y = 2**. (2, 1) fails both, (1, 3) gives 7 and 0, and (3, 1) satisfies the first but gives 8 in the second.',
  'For the pair a1x + b1y + c1 = 0 and a2x + b2y + c2 = 0, the cross-multiplication method gives x equal to:':
    'x = **(b1c2 - b2c1)/(a1b2 - a2b1)**, the standard cross-multiplication result. Reversing the numerator gives -x, and the option built from c and a is the formula for y.',
  'The pair of equations x + y = 5 and x + y = 7 is:':
    'The coefficients give a1/a2 = b1/b2 = 1 but c1/c2 = 5/7, so the lines are **parallel and inconsistent** - no pair (x, y) can satisfy both. They are valid linear equations, just not a solvable pair.',
  'Two lines given by a1x + b1y + c1 = 0 and a2x + b2y + c2 = 0 are coincident when:':
    'Coincident lines need **all three ratios equal**: a1/a2 = b1/b2 = c1/c2. If only the first two match, the lines are parallel and distinct - the usual near-miss.',
  'The solution of x + y = 7 and x - y = 3 gives x equal to:':
    'Adding eliminates y: 2x = 10, so **x = 5** (and y = 2). 2 is y, and 4 comes from subtracting the equations instead of adding them.',
  'The pair x + 2y = 5 and 2x + 4y = 10 has:':
    'The second equation is exactly twice the first, so both describe the **same line**: **infinitely many solutions**. Parallel distinct lines would give none, and a single crossing would give exactly one.',
  'Solve 2x + y = 8 and x - y = 1.':
    'Add the equations: 3x = 9, so **x = 3**, then y = 8 - 2(3) = **2**. Check in the second equation: 3 - 2 = 1 ✓.',
  'A pair of linear equations is inconsistent when the lines are':
    'A pair is inconsistent when the lines are **parallel** and never meet, i.e. a1/a2 = b1/b2 ≠ c1/c2. Intersecting lines give one solution and coincident lines give infinitely many.',
  'If two lines are coincident, the pair of equations has':
    'Coincident lines are the same line, so every point on it satisfies both equations: **infinitely many solutions**. One solution means they cross once, none means they are parallel and distinct.',
  'Solve: x^2 - 5x + 6 = 0':
    'Factorise: x² - 5x + 6 = (x - 2)(x - 3), so **x = 2 or x = 3**. A product is zero exactly when one of its factors is zero, which is why both values are roots.',
  'The roots of 2x^2 + 5x - 3 = 0, found by the quadratic formula, are:':
    'With a = 2, b = 5, c = -3 the discriminant is 25 + 24 = 49, so x = (-5 ± 7)/4, giving **1/2 and -3**. The +24 comes from c being negative - dropping that sign flips the whole answer.',
  'The discriminant of the quadratic equation 3x^2 - 2x + 5 = 0 is:':
    'D = b² - 4ac = (-2)² - 4(3)(5) = 4 - 60 = **-56**. A negative discriminant means the equation has no real roots, and squaring the -2 is what gives +4.',
  'For what values of k does the equation 2x^2 + kx + 8 = 0 have equal roots?':
    'Equal roots need D = 0: k² - 4(2)(8) = 0, so k² = 64 and **k = ±8**. Taking only +8 misses the other solution - a square has two roots.',
  'A quadratic equation has discriminant -9. Which statement about its roots is true?':
    'With a negative discriminant the square root in the formula is not real, so there are **no real roots**. Zero gives two equal roots and a positive value gives two distinct real roots.',
  'The roots of x^2 - 5x + 6 = 0 are:':
    'Factorise as (x - 2)(x - 3), so the roots are **2 and 3**. -1 and -6, or 1 and 6, multiply to 6 but do not add to -5, so neither pair can be right.',
  'The roots of ax^2 + bx + c = 0 are given by:':
    'x = **(-b ± √(b² - 4ac)) / 2a**. The three classic slips: forgetting to negate b, writing b² + 4ac, and dividing by a instead of 2a.',
  'The discriminant of 2x^2 - 4x + 3 = 0 is:':
    'D = b² - 4ac = 16 - 24 = **-8**, so the equation has no real roots. Dropping the minus sign in -4ac gives +40 or +8.',
  'If the discriminant of a quadratic equation is zero, its roots are:':
    'A zero discriminant makes the ± part vanish, so the two roots collapse into **one real, repeated root**. Negative gives no real roots and positive gives two distinct ones.',
  'Find the nature of the roots of x^2 - 4x + 4 = 0.':
    'D = 16 - 16 = **0**, so the roots are **real and equal**: x² - 4x + 4 = (x - 2)², giving the repeated root **2**. "Nature" asks about real/equal, not just the values.',
  'Solve x^2 - 5x + 6 = 0 by factorising. The roots are':
    'Find two numbers that multiply to +6 and add to -5: -2 and -3. So x² - 5x + 6 = (x - 2)(x - 3) and the roots are **2 and 3**.',
  'In the quadratic formula, the denominator is':
    'The formula divides the whole numerator by **2a**, not a. Forgetting the 2 is the most common error; b² - 4ac is the discriminant, not the denominator.',
  'A quadratic equation has no real roots when the discriminant is':
    'With a **negative** discriminant, b² - 4ac sits under a square root and no real number squares to a negative - so no real roots. Zero gives equal roots, positive gives two distinct real roots.',
  'Find the 10th term of the AP: 2, 5, 8, 11, ...':
    'a = 2 and d = 3, so a₁₀ = a + 9d = 2 + 27 = **29**. Using n instead of n - 1 would give 32 - the first term already counts as term 1.',
  'The common difference of the arithmetic progression 7, 4, 1, -2, ... is:':
    'Each term is 3 less than the one before: 4 - 7 = **-3**. The difference is negative because the progression is decreasing.',
  'The sum of the first 20 terms of the arithmetic progression 3, 7, 11, ... is:':
    'a = 3, d = 4, so a₂₀ = 3 + 19(4) = 79 and S₂₀ = 20/2 x (3 + 79) = **820**. Taking d = 3 or using a + 20d instead of a + 19d gives the other options.',
  'The sum of the first n positive integers is given by:':
    '**n(n + 1)/2** - Gauss\'s pairing of 1 with n, 2 with n - 1, and so on. n(n + 1) forgets the division by 2, and n² is the sum of the first n odd numbers.',
  'A ladder has rungs whose lengths decrease uniformly by 2 cm from the bottom to the top. The bottom rung is 45 cm long and the top rung is 25 cm long. How many rungs are there?':
    'This is an AP with a = 45, d = -2 and last term 25: 25 = 45 + (n - 1)(-2), so n - 1 = 10 and **n = 11**. Forgetting the +1 gives 10.',
  'A factory produced 600 units in the third year and 700 units in the seventh year, the production increasing uniformly every year. How many units did it produce in the first year?':
    'a₃ = a + 2d = 600 and a₇ = a + 6d = 700; subtracting gives 4d = 100, so d = 25 and a = 600 - 50 = **550**. Treating 600 as the first term ignores the two steps before year 3.',
  'The 10th term of the AP 3, 7, 11, ... is:':
    'a = 3, d = 4, so a₁₀ = 3 + 9(4) = **39**. Using n = 10 directly in a + nd gives 43, one step too many.',
  'The common difference of the AP 5, 2, -1, ... is:':
    '2 - 5 = **-3**, and every term keeps falling by 3. A positive 3 would make the progression increase instead.',
  'The sum of the first 20 natural numbers is:':
    'n(n + 1)/2 = 20 x 21/2 = **210**. 420 is n(n + 1) without dividing by 2, and 190 or 200 come from arithmetic slips.',
  'For an AP with first term 7 and common difference 3, the sum of the first 10 terms is:':
    'a₁₀ = 7 + 9(3) = 34, so S₁₀ = 10/2 x (7 + 34) = **205**. Using a₁₀ = 37 (an off-by-one in n - 1) gives 220.',
  'Find the sum of the first 15 terms of the AP 4, 9, 14, ...':
    'a = 4, d = 5, so a₁₅ = 4 + 14(5) = 74 and S₁₅ = 15/2 x (4 + 74) = 15 x 39 = **585**. The 15/2 is not a mistake: the average of the first and last terms is multiplied by the number of terms.',
  'The nth term of an AP with first term a and common difference d is':
    'aₙ = **a + (n - 1)d**. The (n - 1) is there because the first term already is a - using nd counts one step too many.',
  'What is the common difference of the AP 7, 11, 15, 19?':
    '11 - 7 = **4**, and every term rises by the same amount. 3 comes from counting terms rather than the difference between them.',
  'In similar triangles, the ratio of corresponding sides is __.':
    'In similar triangles the ratio of corresponding sides is **equal** for every pair - that constant ratio is the scale factor, and corresponding angles are equal too. If the sides were equal in length the triangles would be congruent, not merely similar.',
  'In triangle ABC, DE is parallel to BC with D on AB and E on AC. If AD = 4 cm, DB = 6 cm and AE = 6 cm, then EC is:':
    'By the basic proportionality theorem AD/DB = AE/EC, so 4/6 = 6/EC and EC = **9 cm**. Using AD/AB instead of AD/DB is the usual mix-up.',
  'Two triangles are similar and the ratio of their corresponding sides is 3 : 5. The ratio of their areas is:':
    'Areas scale as the **square** of the side ratio: (3/5)² = **9 : 25**. 27 : 125 is the cube (volumes) and 3 : 5 is the side ratio itself.',
  'The areas of two similar triangles are 49 cm^2 and 64 cm^2. The ratio of their corresponding medians is:':
    'Corresponding medians scale as the **square root** of the area ratio: √49 : √64 = **7 : 8**. 49 : 64 is the area ratio, not the median ratio.',
  'Two similar triangular fields have areas 100 m^2 and 144 m^2. A side of the smaller field is 25 m. The corresponding side of the larger field is:':
    'The area ratio is 144/100, so the side ratio is √(144/100) = 12/10 = 6/5. The larger side is 25 x 6/5 = **30 m**; 24 m applies the area ratio directly instead of its square root.',
  'Two triangles are similar if:':
    'Two triangles are similar when their **corresponding angles are equal** (AA), which also makes the sides proportional. Equal area, equal sides or equal perimeter do not imply similarity - equal sides would even mean congruence.',
  'In triangle ABC, DE is parallel to BC. If AD/DB = 2/3 and AE = 4 cm, then EC is:':
    'AD/DB = AE/EC gives 2/3 = 4/EC, so EC = **6 cm**. Cross-multiplying the wrong way round gives 8/3 ≈ 2.7 cm.',
  'If two similar triangles have their sides in the ratio 2:3, the ratio of their areas is:':
    'Areas go as the square of the side ratio: (2/3)² = **4 : 9**. 8 : 27 is the cube (volumes) and 2 : 3 is the sides themselves.',
  'A vertical pole 6 m tall casts a shadow 4 m long. At the same time a tower casts a shadow 28 m long. The height of the tower is:':
    'Both triangles are similar because the sun is at the same angle, so height/shadow is constant: 6/4 = h/28, giving h = **42 m**. 28 m would mean the shadow always equals the height.',
  'In triangle ABC, DE is parallel to BC with AD = 3 cm, DB = 5 cm and AE = 4.5 cm. Find EC.':
    'By the basic proportionality theorem AD/DB = AE/EC, so 3/5 = 4.5/EC and EC = 5 x 4.5/3 = **7.5 cm**. Check: 3/5 = 4.5/7.5 = 0.6 ✓.',
  'Two triangles are similar if two angles of one equal two angles of the other. This is the':
    'Two equal angles are enough, because the third must match (angles of a triangle sum to 180°) - that is the **AA criterion**. SSS needs three sides and SAS needs two sides with the included angle.',
  'If two triangles are similar, the ratio of their areas equals the ratio of':
    'For similar triangles the ratio of areas equals the ratio of the **squares of corresponding sides** (and likewise of corresponding medians and altitudes). Perimeters scale linearly, so their ratio is not the area ratio.',
  'Find the distance between points (1, 2) and (4, 6).':
    'd = √((4 - 1)² + (6 - 2)²) = √(9 + 16) = √25 = **5 units**. Square each difference first, then add - squaring the sum instead gives the wrong number.',
  'The point that divides the line segment joining (2, 3) and (6, 7) internally in the ratio 1 : 3 is:':
    'Section formula with m : n = 1 : 3: x = (1 x 6 + 3 x 2)/4 = 3 and y = (1 x 7 + 3 x 3)/4 = 4, so the point is **(3, 4)**. The midpoint (4, 5) is the 1 : 1 case, which is why it is the tempting wrong answer.',
  'The point that divides the line segment joining (-1, 7) and (4, -3) internally in the ratio 2 : 3 is:':
    'x = (2 x 4 + 3 x (-1))/5 = (8 - 3)/5 = 1 and y = (2 x (-3) + 3 x 7)/5 = (-6 + 21)/5 = 3, so the point is **(1, 3)**. Swapping m and n gives a different point.',
  'The area of the triangle with vertices (1, 2), (3, 0) and (5, 4) is:':
    'Area = ½|x₁(y₂ - y₃) + x₂(y₃ - y₁) + x₃(y₁ - y₂)| = ½|1(0 - 4) + 3(4 - 2) + 5(2 - 0)| = ½|-4 + 6 + 10| = **6 square units**. Dropping the ½ gives 12.',
  'The points (1, 2), (3, 6) and (5, 10) are:':
    'The slopes match: (6 - 2)/(3 - 1) = 2 and (10 - 6)/(5 - 3) = 2, and the triangle they form has area 0, so the points are **collinear** - all three lie on y = 2x.',
  'For what value of k are the points (2, 3), (4, k) and (6, 9) collinear?':
    'Collinear means equal slopes: (k - 3)/2 = (9 - k)/2, so k - 3 = 9 - k and **k = 6**. Equivalently, the middle y is the average of 3 and 9.',
  'The distance between the points (3, 4) and (0, 0) is:':
    'd = √(3² + 4²) = √(9 + 16) = √25 = **5 units** - the 3-4-5 triangle. 25 is the squared distance, not the distance.',
  'The midpoint of the points (2, 3) and (6, 7) is:':
    'Average the coordinates: ((2 + 6)/2, (3 + 7)/2) = **(4, 5)**. Adding without dividing gives (8, 10) - the answer to watch for.',
  'The area of the triangle with vertices (0, 0), (4, 0) and (0, 3) is:':
    'This is a right triangle with legs 4 and 3 along the axes, so area = ½ x 4 x 3 = **6 square units**. 12 forgets the half.',
  'Find the point on the x-axis that is equidistant from (2, -5) and (-2, 9).':
    'A point on the x-axis is (x, 0). Equating the squared distances: (x - 2)² + 25 = (x + 2)² + 81, which reduces to -4x + 29 = 4x + 85, so x = **-7** and the point is **(-7, 0)**. Checking: both distances are √106.',
  'What is the distance between (0, 0) and (3, 4)?':
    '√(9 + 16) = **5**. 25 is the square of the distance, and 7 is just 3 + 4.',
  'The midpoint of the segment joining (2, 3) and (6, 7) is':
    'Average each coordinate: **(4, 5)**. (8, 10) is the sum without dividing by 2, and (2, 2) comes from subtracting.',
  'Three points are collinear when the area of the triangle they form is':
    'Three collinear points form no triangle, so the area is **zero**. Area cannot be negative or infinite - it is a non-negative quantity, which is why the formula uses the absolute value.',
  'sin 30 degrees = ?':
    'sin 30° = **1/2**. The standard values: sin 0 = 0, sin 30 = 1/2, sin 45 = 1/√2, sin 60 = √3/2, sin 90 = 1. √3/2 is sin 60, the classic mix-up.',
  'In triangle ABC, right-angled at B, AB = 8 cm and BC = 15 cm. Then tan A is:':
    'The angle is at A, so the opposite side is BC = 15 and the adjacent side is AB = 8, giving tan A = **15/8**. 8/15 is tan C, and 15/17 would be sin A (the hypotenuse is 17).',
  'In a right triangle, the hypotenuse is 13 cm and one leg is 5 cm. The length of the other leg is:':
    'Pythagoras: √(13² - 5²) = √(169 - 25) = √144 = **12 cm** - the 5-12-13 triple. Adding instead of subtracting gives 18, which is longer than the hypotenuse.',
  'If sin A = 5/13, then cos^2 A equals:':
    'cos²A = 1 - sin²A = 1 - 25/169 = **144/169**. The option 12/13 is cos A itself, not its square.',
  'The value of 9 sec^2 A - 9 tan^2 A is:':
    'Factor out the 9: 9(sec²A - tan²A) = 9 x 1 = **9**, using sec²A - tan²A = 1. Reaching for sin² + cos² = 1 here gives 0 and the wrong identity.',
  'In a right triangle, sin of an angle equals:':
    'sin = **opposite side / hypotenuse**. Adjacent / hypotenuse is cos, opposite / adjacent is tan, and adjacent / opposite is cot - the four ratios to keep straight.',
  'If sin theta = 3/5 in a right triangle, then cos theta is:':
    'Use the 3-4-5 triangle: sin = 3/5 means opposite 3 and hypotenuse 5, so the adjacent side is √(25 - 9) = 4 and cos θ = **4/5**. 3/4 would be tan θ.',
  'sin squared theta plus cos squared theta equals:':
    '**sin²θ + cos²θ = 1** for every angle - the Pythagorean identity, which is Pythagoras applied to a point on the unit circle.',
  'The value of tan 45 degrees is:':
    'tan 45° = **1**, because at 45° the opposite and adjacent sides of the right triangle are equal. 1/√3 is tan 30 and √3 is tan 60.',
  'If tan theta = 3/4, find sin theta.':
    'Take opposite = 3 and adjacent = 4, so the hypotenuse is √(9 + 16) = 5 and **sin θ = 3/5**. tan is opposite/adjacent, so 3/4 alone is not sin.',
  'In a right triangle, sin A equals':
    '**opposite side / hypotenuse**. adjacent / hypotenuse is cos and opposite / adjacent is tan; the ratio must use the hypotenuse, not the other leg.',
  'What is the value of sin 30 degrees?':
    'sin 30° = **1/2** - the side opposite a 30° angle is half the hypotenuse. √3/2 is sin 60, 0 is sin 0 and 1 is sin 90.',
  'The angle of elevation of a point viewed by an observer is the angle formed by the line of sight with the horizontal when the point is':
    'The object is **above the horizontal level** of the observer. When it is below the horizontal the angle is one of depression instead.',
  'From the top of a lighthouse 75 m high, the angle of depression of a ship is 30 degrees. The distance of the ship from the foot of the lighthouse is':
    'The angle of depression from the top equals the angle of elevation from the ship, so tan 30° = 75/d and d = 75/(1/√3) = **75√3 m**. Using tan 30 as √3 instead of 1/√3 gives 25√3.',
  "The shadow of a tower standing on level ground is 40 m longer when the Sun's altitude is 30 degrees than when it is 60 degrees. The height of the tower is":
    'Let h be the height and x the shorter shadow. At 60°: x = h/√3. At 30°: x + 40 = h√3. Subtracting, 40 = h(√3 - 1/√3) = h(2/√3), so h = **20√3 m**.',
  'An observer 1.5 m tall stands 28.5 m away from a chimney. The angle of elevation of the top of the chimney from her eyes is 45 degrees. Find the height of the chimney.':
    'At 45° the height above eye level equals the horizontal distance, 28.5 m. The chimney is that plus the observer\u2019s height: 28.5 + 1.5 = **30 m**. Forgetting the eye height gives 28.5 m.',
  'The angle measured upward from the horizontal to an object above the observer is the:':
    'The **angle of elevation** - measured upward from the horizontal. The angle of depression is measured downward, and refraction and deviation belong to optics.',
  'From the top of a tower, the angle measured downward to a car on the road is called the:':
    'The **angle of depression** - measured downward from the horizontal at the observer. The angle of elevation goes upward, and reflection and incidence are optics terms.',
  'A ladder makes an angle of 60 degrees with the ground and its foot is 3 m from a wall. The length of the ladder is:':
    'The ground distance is the side adjacent to the 60° angle, so cos 60° = 3/L and L = 3/(1/2) = **6 m**. Using sin or tan here is the usual slip.',
  'The angle of elevation of the top of a 30 m tower from a point on the ground is 30 degrees. The distance of the point from the tower is:':
    'tan 30° = 30/d, so d = 30/tan 30° = 30 x √3 = **30√3 m**. Treating tan 30° as √3 gives 30/√3 instead.',
  'A ladder 10 m long reaches a window 8 m above the ground. Find the distance of the foot of the ladder from the wall.':
    'The wall, the ground and the ladder form a right triangle with the ladder as the hypotenuse: distance = √(10² - 8²) = √36 = **6 m**.',
  'The angle of elevation is measured':
    '**Upwards from the horizontal** - that is what separates it from the angle of depression, which is measured downwards.',
  'The angle of depression is measured':
    '**Downwards from the horizontal** at the observer. Angles of elevation go upwards; along the ground or between two towers is not how the angle is defined.',
  'Which instrument is used in surveying to measure angles?':
    'A **theodolite** measures angles in surveying. A barometer measures pressure, a thermometer temperature and a galvanometer small electric currents.',
  'The tangent at any point of a circle is perpendicular to the __.':
    'The tangent is **perpendicular to the radius through the point of contact**. That is what makes the radius-tangent triangle right-angled, and nearly every tangent problem depends on it.',
  'A tangent is drawn from an external point P to a circle of radius 5 cm with centre O. If OP = 13 cm, the length of the tangent is:':
    'The radius to the point of contact is perpendicular to the tangent, so O, P and the contact point form a right triangle: tangent = √(13² - 5²) = √144 = **12 cm**. Adding instead of subtracting gives 18.',
  'PA and PB are two tangents drawn from an external point P to a circle. If PA = 7 cm, then PB equals:':
    'Tangents from the same external point are **equal** - the two right triangles share OP and the same radius - so PB = **7 cm**. No extra information is needed.',
  'A chord of length 16 cm is drawn in a circle of radius 10 cm. Its distance from the centre is:':
    'The perpendicular from the centre **bisects** the chord, so half of it is 8 and the right triangle gives distance = √(10² - 8²) = √36 = **6 cm**. 8 is half the chord, not the distance.',
  'In a circle of radius 13 cm, the distance of a chord from the centre is 5 cm. The length of the chord is:':
    'Half the chord = √(13² - 5²) = √144 = 12, so the whole chord is **24 cm**. 12 is only half and 26 is the diameter.',
  'ABCD is a cyclic quadrilateral. If angle A = 70°, then angle C equals:':
    'Opposite angles of a cyclic quadrilateral are **supplementary**: ∠A + ∠C = 180°, so ∠C = **110°**. 70° would mean opposite angles are equal, which is not the rule.',
  'A tangent to a circle touches the circle at:':
    'A tangent touches at **exactly one point** - that is what separates it from a secant, which cuts the circle at two points.',
  'The lengths of the two tangents drawn to a circle from an external point are:':
    'They are **equal**, because each forms a right triangle with the same hypotenuse OP and the same radius. "Unequal" or "both equal to the radius" is never implied.',
  'The perpendicular drawn from the centre of a circle to a chord:':
    'The perpendicular from the centre to a chord **bisects** it, and each half can then be found with Pythagoras. It is neither parallel nor equal to the chord.',
  'The opposite angles of a cyclic quadrilateral are:':
    'Opposite angles of a cyclic quadrilateral are **supplementary** - their sum is 180° - because each pair subtends the two arcs that together make the whole circle. Complementary and equal are different relations.',
  'Two concentric circles have radii 5 cm and 3 cm. Find the length of the chord of the larger circle that touches the smaller circle.':
    'The chord of the larger circle touches the smaller one, so the 3 cm radius is perpendicular to it at the midpoint. Half the chord = √(25 - 9) = 4, so the chord is **8 cm** long.',
  'A tangent to a circle meets it at':
    '**Exactly one point**. A line that met the circle twice would be a secant, and a line that never meets it is not a tangent at all.',
  'In a cyclic quadrilateral, the sum of a pair of opposite angles is':
    'A pair of opposite angles sums to **180°** (they are supplementary). 360° is the sum of all four angles together, not of one pair.',
  'In a circle of radius 21 cm, an arc subtends an angle of 60 degrees at the centre. Taking pi = 22/7, the length of the arc is':
    'Arc = (θ/360) x 2πr = (60/360) x 2 x (22/7) x 21 = (1/6) x 132 = **22 cm**. Using θ/180 by mistake doubles it to 44.',
  'Taking pi = 22/7, the area of a quadrant of a circle of radius 7 cm is':
    'A quadrant is a quarter of the circle: ¼ x (22/7) x 7² = ¼ x 154 = **38.5 cm²**. 154 cm² is the whole circle and 19.25 cm² is an eighth of it.',
  'A chord of a circle of radius 10 cm subtends a right angle at the centre. Taking pi = 3.14, the area of the minor segment is':
    'Sector = ¼ x 3.14 x 100 = 78.5 cm², triangle = ½ x 10 x 10 = 50 cm², so the segment is 78.5 - 50 = **28.5 cm²**. 78.5 is the sector, not the segment.',
  'A square lawn has a side of 14 m. A circular flower bed of radius 7 m is laid inside it. Taking pi = 22/7, find the area of the lawn left uncovered by the bed.':
    'Square = 14 x 14 = 196 m²; bed = (22/7) x 7² = 154 m²; uncovered = 196 - 154 = **42 m²**. The bed fits exactly inside, so nothing overlaps.',
  'An arc of a circle of radius 21 cm subtends an angle of 60° at the centre. Taking π = 22/7, the length of the arc is:':
    '(60/360) x 2 x (22/7) x 21 = **22 cm**. 33 cm comes from using θ/240 instead of θ/360, and 44 cm from θ/180.',
  'An arc of length 22 cm subtends an angle of 90° at the centre of a circle. Taking π = 22/7, the radius of the circle is:':
    'Arc = (90/360) x 2 x (22/7) x r = (11/7)r, so 22 = (11/7)r and r = **14 cm**. A radius of 7 cm would give an arc of 11 cm.',
  'A sector of a circle of radius 14 cm has a central angle of 90°. Taking π = 22/7, its area is:':
    'Area = (90/360) x (22/7) x 196 = ¼ x 616 = **154 cm²**. 616 cm² is the whole circle and 308 cm² a semicircle.',
  'The area of a sector of a circle of radius 7 cm is 77 cm^2. Taking π = 22/7, the central angle of the sector is:':
    '77 = (θ/360) x (22/7) x 49 = (θ/360) x 154, so θ/360 = 0.5 and θ = **180°**. A 90° sector of this circle would be 38.5 cm².',
  'A chord subtends an angle of 90° at the centre of a circle of radius 7 cm. Taking π = 22/7, the area of the corresponding minor segment is:':
    'Sector = ¼ x (22/7) x 49 = 38.5 cm²; triangle = ½ x 7 x 7 = 24.5 cm²; segment = 38.5 - 24.5 = **14 cm²**. 38.5 is the sector and 24.5 the triangle.',
  'The area of the major segment of a circle is equal to:':
    'The major segment is **the circle minus the minor segment** - the two segments together make up the whole circle. Subtracting the sector would leave the triangle instead.',
  'A circle is inscribed in a square of side 14 cm. Taking π = 22/7, the area of the region between the square and the circle is:':
    'Square = 196 cm², circle = (22/7) x 7² = 154 cm², so the four corners together are 196 - 154 = **42 cm²**. 154 is the circle and 196 the square.',
  'A semicircle is drawn outside a square of side 14 m, with one side of the square as its diameter. Taking π = 22/7, the area of the semicircle is:':
    'The diameter is 14 m, so r = 7 and the semicircle is ½ x (22/7) x 49 = **77 m²**. 154 m² would be the full circle.',
  'The length of an arc of a circle of radius 7 cm that subtends 90 degrees at the centre is:':
    'Arc = (90/360) x 2 x (22/7) x 7 = ¼ x 44 = **11 cm**. 22 cm is the arc of a semicircle of the same radius.',
  'The area of a sector of angle 90 degrees in a circle of radius 14 cm is:':
    '¼ x (22/7) x 196 = **154 cm²**. 616 cm² is the whole circle, and 308 cm² is half of it.',
  'The area of a segment of a circle is found by subtracting:':
    'A segment is what remains when the **triangle is taken out of the sector**, with the chord as the base of that triangle. Subtracting the sector from the circle would leave everything except the segment.',
  'The area of the ring between two concentric circles of radii 7 cm and 14 cm is:':
    'Area of the ring = π(R² - r²) = (22/7)(196 - 49) = (22/7)(147) = **462 cm²**. 154 cm² is the inner circle and 616 cm² the outer.',
  'Find the area of a quadrant of a circle of radius 14 cm.':
    'A quadrant is a quarter of the circle: ¼ x (22/7) x 196 = ¼ x 616 = **154 cm²**. Forgetting the quarter gives the whole circle.',
  'Find the curved surface area of a cylinder with radius 7 cm and height 10 cm.':
    'CSA = 2πrh = 2 x (22/7) x 7 x 10 = **440 cm²**. The 2 is there because the curved surface is a rectangle of width 2πr; adding the two circles would give the total surface area instead.',
  'A toy is made by mounting a cone on a hemisphere of the same radius. The total surface area of the toy is:':
    'Only the **curved surfaces** count: the cone base and the flat face of the hemisphere are glued together and sit inside the solid, so they are not on the outside. Adding them would count hidden faces.',
  'A solid is formed by placing a cone of radius 2 cm and height 3 cm on a hemisphere of radius 2 cm. Its volume is:':
    'Cone = ⅓πr²h = ⅓π(4)(3) = 4π cm³; hemisphere = ⅔πr³ = ⅔π(8) = 16π/3 cm³. Total = 12π/3 + 16π/3 = **28π/3 cm³**.',
  'A frustum of a cone has height 7 cm and base radii 6 cm and 3 cm. Its volume is:':
    'V = ⅓πh(r₁² + r₁r₂ + r₂²) = ⅓π(7)(36 + 18 + 9) = ⅓π(7)(63) = **147π cm³**. Using only one radius (the cone formula) gives 84π or 21π.',
  'A frustum of a cone has base radii 5 cm and 3 cm and slant height 4 cm. Its curved surface area is:':
    'CSA = π(r₁ + r₂)l = π(5 + 3)(4) = **32π cm²**. Using a single radius gives 20π or 12π - both radii appear in the frustum formula.',
  'A solid sphere of radius r is cut into two equal hemispheres. The total surface area of the two hemispheres together exceeds the surface area of the original sphere by:':
    'Each hemisphere gains a flat circular face of area πr², so the two together add **2πr²** to the original 4πr². Cutting never removes surface - it only exposes new faces.',
  'A cube of side 6 cm is cut into smaller cubes of side 2 cm. The total surface area of all the smaller cubes is:':
    'The 6 cm cube becomes 3 x 3 x 3 = 27 small cubes, each with surface 6 x 2² = 24 cm², so the total is 27 x 24 = **648 cm²** - three times the original 216 cm².',
  'The curved surface area of a cylinder of radius 7 cm and height 10 cm, taking π = 22/7, is:':
    '2 x (22/7) x 7 x 10 = **440 cm²**. 880 is simply double the answer, and 660 or 220 come from using the wrong factor in 2πrh.',
  'A capsule is in the shape of a cylinder with a hemisphere stuck at each end. Its total length is 14 mm and its diameter is 5 mm. The height of the cylindrical part is:':
    'The two hemispherical ends have radius 2.5 mm each, so together they use 5 mm of the length: 14 - 5 = **9 mm** of cylinder. Subtracting 10 would remove two full diameters.',
  'A bucket is in the shape of a frustum with base radii 15 cm and 10 cm and height 12 cm. Its volume is:':
    'V = ⅓π(12)(225 + 150 + 100) = 4π(475) = **1900π cm³**. Dropping the middle term r₁r₂ gives 1300π - the cross term is the whole point of a frustum.',
  'The slant height of a frustum of a cone with base radii r1 and r2 and height h is:':
    'The difference of the radii and the height form a right triangle, so l = **√(h² + (r₁ - r₂)²)**. Using the sum of the radii describes a different cone.',
  'Two cubes, each of volume 64 cm^3, are joined end to end. The surface area of the resulting cuboid is:':
    'Each cube has side 4 cm, so joined they make an 8 x 4 x 4 cuboid with surface 2(32 + 32 + 16) = **160 cm²**. 128 cm² is the sum of the two separate surfaces, which counts the hidden faces twice.',
  'The volume of a sphere of radius r is:':
    'V = **4/3 πr³**. 4πr² is its surface area, 2/3 πr³ is a hemisphere and πr²h belongs to a cylinder.',
  'When a cone is placed on a cylinder, the total surface area of the solid does NOT include:':
    'The **common circular face** where the cone sits on the cylinder is inside the solid, so it is not part of the outer surface. The cylinder base and both curved surfaces are.',
  'The volume of a frustum of height h with base radii r1 and r2 is:':
    'V = **⅓πh(r₁² + r₁r₂ + r₂²)**. The middle cross term is what distinguishes a frustum from a cylinder; every other option leaves it out.',
  'When a solid sphere is melted and recast into many small spheres, the total surface area:':
    'Volume is conserved, but the **surface area increases**: many small spheres expose far more surface than one large one for the same volume. That is why a powder reacts faster than a lump.',
  'A cylinder and a cone have the same base radius and the same height. Find the ratio of their volumes.':
    'V(cylinder) = πr²h and V(cone) = ⅓πr²h, so the ratio is **3 : 1**. A cone is exactly one third of the cylinder that encloses it.',
  'The median of the data 3, 5, 7, 9, 11 is __.':
    'With five values in order the median is the **middle one**, the third: **7**. The mean happens to be 7 here too, but the median comes from position, not from adding.',
  'The mean of the distribution 0-10 : 4, 10-20 : 6, 20-30 : 10, 30-40 : 5, 40-50 : 5 is:':
    'Class marks are 5, 15, 25, 35, 45, so Σfx = 20 + 90 + 250 + 175 + 225 = 760 and n = 30, giving mean = 760/30 = **25.33**. Using the lower limits instead of the marks shifts the result.',
  'For the distribution 0-10 : 4, 10-20 : 6, 20-30 : 10, 30-40 : 5, 40-50 : 5, the modal class is:':
    'The modal class is the one with the **highest frequency**, which is 10, and that belongs to **20 - 30**. In grouped data the mode is a class, not a single value.',
  'In a distribution, the frequencies of the classes 0-10, 10-20 and 20-30 are 5, 8 and 12. The number of observations less than 30 is:':
    '"Less than 30" includes all three classes: 5 + 8 + 12 = **25**. 17 is only the first two, which is "less than 20".',
  'In an ogive, the median is read at the cumulative frequency equal to:':
    'The median is where the cumulative frequency reaches **n/2**, halfway through the data. Reading at n gives the maximum value, not the middle.',
  'The two ogives of a distribution intersect at the point (35, 20). The median of the distribution is:':
    'The intersection carries the **x-coordinate of the median**, so the median is **35**; 20 is the cumulative frequency there, not the median value.',
  'The median of the observations 5, 8, 11, 14, 17 and 20 is:':
    'With six values the median is the **average of the third and fourth**: (11 + 14)/2 = **12.5**. Choosing 14 takes the upper middle value instead of averaging the pair.',
  'For a distribution the mean is 30 and the mode is 24. Using the empirical relation between mean, median and mode, the median is:':
    'Mode = 3 median - 2 mean, so 24 = 3M - 60 and M = **28**. Equivalently, median = (2 x mean + mode)/3 = 84/3.',
  'The mean of the distribution 10-20 : 5, 20-30 : 8, 30-40 : 7 is:':
    'Class marks are 15, 25, 35: Σfx = 75 + 200 + 245 = 520 and n = 20, so the mean is **26**. Using the upper limits instead of the marks gives a larger value.',
  'The cumulative frequencies of the classes 0-10, 10-20 and 20-30 are 6, 15 and 25. The frequency of the class 10-20 is:':
    'Frequency is the difference between consecutive cumulative frequencies: 15 - 6 = **9**. 15 is the cumulative total up to that class, not the class frequency.',
  'A distribution has total frequency 60. The median is read from its ogive at the cumulative frequency:':
    'The median sits at **n/2 = 30** on the cumulative frequency axis. 60 is the maximum and 15 would be the lower quartile position.',
  'The mode of the data 2, 3, 3, 4, 5 is:':
    'The mode is the **most frequent** value: 3 appears twice, everything else once. It is not the middle value (that is the median).',
  'In a grouped frequency table, the class mark is:':
    'The class mark is the **midpoint** of the interval, (lower + upper)/2 - 25 for 20-30. Using a limit instead of the mark is the classic grouped-mean error.',
  "A 'less than' ogive is drawn by plotting:":
    'A "less than" ogive plots **upper class limits against cumulative frequency**. Lower limits with frequency gives a histogram, and class marks with frequency gives a frequency polygon.',
  'The median is read from an ogive at the cumulative frequency equal to:':
    '**Half of the total frequency** - the value n/2 on the cumulative axis. One fourth would give the lower quartile, not the median.',
  'Find the median of 5, 8, 12, 15, 20.':
    'The data is already in order and there are five values, so the median is the middle (third) one: **12**. Two values lie on each side of it.',
  'What is the probability of getting a head when tossing a coin?':
    'A fair coin has two equally likely outcomes, so P(head) = 1 favourable / 2 total = **1/2** (0.5). Probability is always between 0 and 1.',
  'Two dice are thrown together. The number of outcomes in the sample space is:':
    'Each die has 6 outcomes and they are independent, so the sample space has 6 x 6 = **36** ordered pairs. Adding 6 + 6 = 12 describes something else entirely.',
  'If the probability of an event E is 0.35, then the probability of not E is:':
    'P(E) + P(not E) = 1, so P(not E) = 1 - 0.35 = **0.65**. The two probabilities must add to exactly 1.',
  'A fair die is thrown once. The probability of getting a prime number is:':
    'The primes on a die are 2, 3 and 5 - three outcomes out of six - so P = 3/6 = **1/2**. Counting 1 as prime gives 4/6 = 2/3, the classic error (1 is not prime).',
  'Two dice are thrown together. The probability that the sum of the numbers is 7 is:':
    'The favourable pairs are (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) - six of the 36 outcomes - so P = 6/36 = **1/6**. 7/36 mistakes the sum for the count of favourable outcomes.',
  'A bag contains 3 red and 5 blue balls. Two balls are drawn one after the other without replacement. The probability that both are red is:':
    'First red: 3/8. Then 2 red remain among 7 balls, so 2/7. P = (3/8)(2/7) = **3/28**. 9/64 comes from replacing the first ball, which is not what "without replacement" means.',
  'A card is drawn at random from a well-shuffled deck of 52 playing cards. The number of favourable outcomes for the event that the card is a face card is:':
    'Face cards are J, Q and K in each of the 4 suits: 3 x 4 = **12**. 16 would wrongly include the aces, 4 is one per suit and 13 is a whole suit.',
  'A coin is tossed three times. The number of possible outcomes in the sample space is:':
    'Each toss doubles the possibilities: 2 x 2 x 2 = **8**. 6 comes from multiplying by 3 instead of 2, and 9 from squaring 3.',
  'A bag contains 5 red, 8 white and 4 green balls. One ball is drawn at random. The probability that the ball drawn is not green is:':
    'There are 5 + 8 + 4 = 17 balls and 4 are green, so 13 are not: P = **13/17**. 4/17 is P(green), and the other options use the wrong counts.',
  'Two coins are tossed together. The probability of getting at least one tail is:':
    'The outcomes are HH, HT, TH, TT; "at least one tail" covers HT, TH and TT - three of four - so **3/4**. 1/4 is P(no tail) and 1/2 is P(exactly one tail).',
  'The probability of an impossible event is:':
    'An impossible event has **no** favourable outcomes, so P = 0/n = **0**. 1 is a certain event, and a probability is never undefined.',
  'The number of outcomes in the sample space when a coin is tossed twice is:':
    'HH, HT, TH, TT - **4** outcomes. 2 is a single toss and 8 is three tosses.',
  'For any event E, the probability of E plus the probability of not E equals:':
    'E and "not E" cover every outcome exactly once, so their probabilities always add to **1**, whatever the experiment.',
  'The probability of getting a sum of 7 when two dice are thrown is:':
    'Six of the 36 pairs give 7, so P = **1/6**. 7/36 uses the sum as if it were the number of favourable outcomes.',
  'A die is thrown once. Find the probability of getting a prime number.':
    'The prime numbers on a die are 2, 3 and 5 - three of the six faces - so P = 3/6 = **1/2**. Remember that 1 is not prime.',
  'To divide a line segment AB in the ratio 3 : 4, how many points are marked at equal distances on the ray AX drawn at an acute angle to AB?':
    'You mark **3 + 4 = 7** equal parts, join the 7th point to B, and draw the parallel through the 3rd point. Marking only 3 or 4 cannot express the ratio.',
  'PA is a tangent drawn from an external point P to a circle of radius 5 cm with centre O. If OP = 13 cm, then the length of PA is':
    'The radius to the point of contact is perpendicular to the tangent, so PA = √(13² - 5²) = √144 = **12 cm**. Adding instead of subtracting gives 18, and 24 is double the answer.',
  'A line segment AB of length 10 cm is divided internally at P so that PB : AP = AP : AB. The length AP is':
    'Solving AP/PB = AB/AP with AB = 10 gives AP = 10(√5 - 1)/2 = **5(√5 - 1) ≈ 6.18 cm**. The value 5(3 - √5) ≈ 3.82 cm is the shorter part, not the longer one.',
  'Describe the steps to draw a pair of tangents to a circle of radius 4 cm which are inclined to each other at an angle of 60 degrees.':
    'Draw the radius OP, then a second radius OQ with ∠POQ = 180° - 60° = **120°** (the angle between the tangents and the angle between the radii are supplementary at the centre). Perpendiculars at P and Q meet at T, giving tangents TP and TQ inclined at 60°.',
  'The coordinates of the point that divides the line segment joining (-1, 7) and (4, -3) internally in the ratio 2 : 3 are:':
    'x = (2 x 4 + 3 x (-1))/5 = 1 and y = (2 x (-3) + 3 x 7)/5 = 3, so the point is **(1, 3)**. Swapping the ratios gives a different point on the segment.',
  'The coordinates of the point that divides the line segment joining (0, 1) and (3, 4) internally in the ratio 2 : 1 are:':
    'x = (2 x 3 + 1 x 0)/3 = 2 and y = (2 x 4 + 1 x 1)/3 = 3, so **(2, 3)**. The section formula weights the far end by the near ratio - mixing that up gives (1, 2).',
  'The golden ratio is the positive root of the equation:':
    'If the whole is to the larger part as the larger part is to the smaller, the ratio x satisfies **x² - x - 1 = 0**, whose positive root is (1 + √5)/2. The other options have the wrong signs or coefficients.',
  'A line segment of length 1 unit is divided in the golden ratio. The length of the longer part is:':
    'The longer part is **(√5 - 1)/2 ≈ 0.618**. (√5 + 1)/2 ≈ 1.618 is the ratio itself, which is larger than the whole segment - a good sanity check.',
  'PA and PB are tangents from an external point P to a circle with centre O. If angle APB = 70°, then angle AOB equals:':
    'The radii at the points of contact are perpendicular to the tangents, so OAPB has 90° at A and at B: ∠AOB = 360° - 90° - 90° - 70° = **110°**. 140° doubles the given angle instead of using the quadrilateral.',
  'To construct the tangents from an external point P to a circle with centre O, an auxiliary circle is drawn with OP as diameter. The centre of this auxiliary circle is:':
    'Since OP is a diameter, the centre of the auxiliary circle is the **midpoint of OP**. It cuts the given circle at the points of contact because the angle in a semicircle is 90°.',
  'Dividing a line segment in the ratio 3:2 means the segment is divided into:':
    '**3 + 2 = 5** equal parts. Dividing into 2 or 3 parts alone cannot represent a 3 : 2 ratio.',
  'The golden ratio is approximately:':
    'The golden ratio is (1 + √5)/2 ≈ **1.618**. 1.414 is √2, 2.236 is √5, and 0.618 is its reciprocal - close, but a different number.',
  'The number of tangents that can be drawn to a circle from an external point is:':
    'Exactly **two** - one on each side of the circle. From a point on the circle there is one, and from a point inside there are none.',
  'To construct a tangent at a point on a circle, the radius at that point must be:':
    'The radius at the point of contact must be **perpendicular to the tangent**. At 45° or parallel it would not touch the circle in the right way.',
  'A line segment of length 7.6 cm is divided in the ratio 5:8. State the lengths of the two parts.':
    'The parts are 7.6 x 5/13 ≈ **2.9 cm** and 7.6 x 8/13 ≈ **4.7 cm**. Dividing by 5 and 8 separately would not make the two parts add back to 7.6 cm.',
  "What was the only thing Lencho's field of ripe corn needed as he kept watching the sky towards the north-east?":
    'He needed **a downpour, or at least a shower**. Rain was the one thing that would turn the ripe corn into a harvest; frost, dry weather or wind would have damaged it instead.',
  'How much money did Lencho ask God for, and how much did he actually receive?':
    'Lencho asked for **a hundred pesos** and received **seventy** - the postmaster could not raise the full amount. That thirty-peso shortfall is exactly what makes him call the post office "a bunch of crooks".',
  "Lencho called the post-office employees 'a bunch of crooks'. Why is this an example of irony?":
    'The "crooks" had **collected the money from their own pockets** to help him. Lencho\'s suspicion falls on the very people who were generous, which is what makes the ending ironic rather than merely sad.',
  "Why did the postmaster answer Lencho's letter, and what does his reply show about him?":
    'He answered so as **not to shake Lencho\'s faith in God**: he collected money from his employees, added part of his own salary and borrowed from friends, then signed the reply "God". It shows his kindness, generosity and respect for another person\'s faith.',
  "What destroyed Lencho's ripe corn field?":
    'A **hailstorm**. Hail fell for an hour, left the corn flattened and the trees bare, and Lencho said the field looked as though it had been set on fire - not locusts, fire or a flood.',
  'How much money did Lencho ask God to send him?':
    '**One hundred pesos** - enough to sow his field again and live until the new crop came. Seventy is what he actually received, not what he asked for.',
  "Lencho's faith in God can best be described as:":
    '**Unshakable**: he writes to God as though to a person who will certainly reply, and when money arrives he never doubts where it came from. The story tests that faith; it never wavers.',
  'The irony at the end of the story is that Lencho:':
    'Lencho **suspects the post-office staff of stealing** the missing thirty pesos, when they were the ones who gave him the money. He thanks God and accuses his helpers - that is the story\'s central irony.',
  'Why did Lencho compare the raindrops to new coins?':
    'He knew good rain would give a good harvest and the harvest would bring money, so the drops looked like **coins** to him. The simile shows both his hope and how completely his living depended on the weather.',
  "What destroyed Lencho's field in 'A Letter to God'?":
    '**A hailstorm**. The hail fell for an hour, flattened the corn and stripped the trees, and Lencho said the field looked as if it had been set on fire.',
  "What makes the ending of 'A Letter to God' ironic?":
    'Lencho **blames the post office for stealing money that the postmen themselves had given**. His faith in God survives, but his judgement of the people who helped him is completely wrong.',
  "How did the postmaster respond to Lencho's letter?":
    'He **collected money from his staff**, added part of his own salary and sent it signed "God" - he did not throw the letter away, write as God himself in words alone, or call the police. The quiet generosity is the point.',
  "Where was Nelson Mandela's inauguration ceremony held on 10 May 1994?":
    'In the **Union Buildings amphitheatre in Pretoria**, before dignitaries from around the world - the largest gathering of international leaders ever seen on South African soil.',
  'According to the news report given in the chapter, how many of the 400 seats did the African National Congress win in the first democratic elections of South Africa?':
    'The ANC won **252** of the 400 seats, a clear majority that made Mandela the first black president. 148 and 140 are the other parties\' tallies.',
  "Mandela says that the oppressor must be liberated just as surely as the oppressed. What does he mean?":
    'He means that **taking away another person\'s freedom makes the oppressor a prisoner of hatred**, locked behind prejudice and fear, so neither is truly free until both are. Freedom is not a quantity that one side loses so the other can gain it.',
  'Why were two national anthems sung at the inauguration, and what did the singing of both signify?':
    'The whites sang **"Die Stem"**, the old anthem of the Republic, and the blacks sang **"Nkosi Sikelel iAfrika"**. Singing both signified the birth of a new, non-racial South Africa in which former enemies were reconciled and treated as equals.',
  'Apartheid was a system of:':
    '**Racial segregation enforced by law** in South Africa: people were classified by race and denied equal rights, movement and opportunity. It was not trade, a one-party system or free education.',
  "Mandela's inauguration as South Africa's first black president was held in:":
    '**Pretoria**, at the Union Buildings amphitheatre. Cape Town is the legislative capital, but the inauguration took place in Pretoria.',
  "The statement 'courage was not the absence of fear but the triumph over it' is an example of:":
    'A **paradox** - the two halves appear to contradict each other (courage without the absence of fear), and that tension is what makes the idea memorable. It is not alliteration, a pun or a simile.',
  'Mandela says the oppressor must be liberated because:':
    'Because the oppressor is **a prisoner of hatred**: his own prejudice robs him of freedom just as surely as the law robbed the oppressed. The line is about both sides of injustice, not about property or fear of the law.',
  'What does Mandela mean when he says the depths of oppression create heights of character?':
    'He means that **great suffering can produce great courage, strength and compassion** - the worst circumstances bring out remarkable human qualities. It is an observation about people, not a justification of oppression.',
  'Apartheid was a system that':
    'It **separated people by race and denied them equal rights**. It began in 1948 and was dismantled only in the 1990s, and it certainly did not give every citizen the same rights.',
  'Whom did Mandela thank in his speech for the freedom of his country?':
    'He thanked **the heroes who had sacrificed their lives** for freedom - the generations of activists who made that day possible. Not foreign governments alone, the prison guards, or his family alone.',
  'According to Mandela, what is the greatest weapon of a leader?':
    '**Courage that comes from standing up again after fear** - Mandela defines courage as the triumph over fear, not its absence. Silence, anger and wealth are not what the chapter calls a leader\'s weapon.',
  'Why was the young seagull afraid to leave his ledge?':
    'He was **certain his wings would never support him**. The fear was in his own mind, not in the wind or in a warning from his brothers - which is what makes the story about self-belief.',
  "In 'The Black Aeroplane', in which aircraft and towards which country was the narrator flying?":
    'An **old Dakota**, flying towards **England** from France. The black aeroplane that appears beside him is the mystery - it is not the narrator\'s aircraft.',
  'What finally made the young seagull take his first flight?':
    '**Hunger**, when his mother held a piece of fish just out of his reach. He dived for it and discovered his wings worked; his father and brothers did not push him off.',
  'How does the writer describe the storm clouds that the pilot flew into?':
    'They looked like **huge black mountains** standing across the sky. Inside, everything suddenly went black, the old Dakota jumped and twisted, and the compass and other instruments went dead.',
  'The young seagull finally flew because:':
    '**Hunger and his mother\'s trick with the fish** - she flew close with food and stopped just out of reach, so he dived and flew. Need overcame fear; nobody pushed him.',
  "In 'Black Aeroplane', the narrator's Dakota was guided out of the storm by:":
    'An **unknown pilot in a black aeroplane** who appeared beside him, signalled, and led him through the storm to the runway. There was no second Dakota and no help from the control room.',
  "The theme shared by both stories in 'Two Stories about Flying' is:":
    '**Overcoming fear through courage and trust** - the young seagull trusts his wings and the pilot trusts the strange black aeroplane. Neither story is about the sea, modern transport or money.',
  "The author of 'Black Aeroplane' describes the storm clouds as:":
    '**Black mountains** - huge dark shapes standing in front of him across the sky. Silver rivers, green fields and white cotton are the opposite of that menacing image.',
  'Why did the pilot of the Dakota feel grateful to the black aeroplane?':
    'The black aeroplane **guided him out of the storm when his instruments had failed**, and he reached the runway safely. When he asks about it afterwards, nobody has seen another plane - which is the story\'s mystery.',
  "In 'His First Flight', what finally makes the young seagull fly?":
    '**Hunger**, when his mother holds food just out of reach. He dives for it and his wings carry him - the fear was never in his wings.',
  "In 'The Black Aeroplane', who helps the narrator land safely?":
    '**A mysterious pilot in a black aeroplane** who comes out of the storm, signals him to follow and leads him to safety. The control room can only hear him and there is no co-pilot.',
  'Which phrase from the flying stories creates the strongest image?':
    '**"The sky was like a blanket of dark clouds"** - a simile that makes the cloud cover feel heavy and enclosing. "He was very hungry" or "the plane was old" are plain statements, not images.',
  'Why did Anne Frank begin writing her diary?':
    'The diary was a **present for her thirteenth birthday** - a red-checkered notebook. It was not a school assignment, a gift from Margot or a punishment from her maths teacher.',
  "Why did Anne decide to call her diary 'Kitty'?":
    'She wanted the diary to be **a real friend she could confide in**: she had no close friend to share her thoughts with, and giving the diary a name made it feel like one.',
  "Anne writes, 'Paper has more patience than people.' What does this remark reveal about her life in hiding?":
    'She had **no real friend in whom she could confide**, so paper became her listener - it never interrupts, judges or loses patience. The line explains why she is writing to "Kitty" at all.',
  "How does Anne's account of her class and of Mr Keesing show that ordinary school life went on even in wartime?":
    'Anne describes the whole class **quaking in its boots** about who will be promoted, and Mr Keesing punishing her with essays on "A Chatterbox". Her third essay in verse makes the class roar with laughter and Keesing take the joke - everyday school worries and humour carry on despite the war.',
  'Anne Frank wrote her diary during:':
    '**The Second World War** - the family was in hiding from the Nazis in occupied Amsterdam while she wrote.',
  'Anne Frank called her diary:':
    '**Kitty** - the name she gave it so that it would feel like a friend. Elli, Margot and Pim are people in her life, not the diary.',
  "Anne's diary entries are written in the form of:":
    '**Letters to an imaginary friend** - most entries begin "Dear Kitty". They are not newspaper reports, official records or poems to her mother.',
  'Despite everything, Anne believed that people are:':
    '**Good at heart** - her most famous line: "in spite of everything I still believe that people are really good at heart". It is the hope that survives the fear of hiding.',
  'Why did Anne Frank feel the need to write a diary?':
    'She had **no close friend she could confide in**, so the diary became the friend she could tell everything to - which is exactly why she calls it Kitty.',
  "Why was Anne Frank's family in hiding?":
    '**They were Jews hiding from the Nazis** during the Second World War. Not travelling, not hiding for fun, and not after a flood.',
  "Why did Anne Frank call her diary 'Kitty'?":
    '**She wanted a friend to confide in**, and naming the diary made it feel like one. Her teacher, her sister and the hiding place had nothing to do with the name.',
  "What does Anne Frank's diary show about people in hard times?":
    'That **hope and kindness can survive even in hiding** - Anne still laughs at school stories and still believes people are good at heart. It is not a story about nobody being trustworthy.',
  'What is the traditional Goan baker, whose loaves the writer remembers, called?':
    '**Pader** - the word for the village baker whose bread was part of every Goan childhood. Kabai is his long frock and bolinhas are the little cakes.',
  'According to the writer, what are a must for Christmas as well as other festivals in Goa?':
    '**Cakes and bolinhas** - the sweet breads and coconut cookies were essential to every Goan festival, Christmas included, along with the daily loaves.',
  "The writer remembers the bread-bangles 'which we chose carefully'. What does this recollection show about the place of the baker in Goan life?":
    'It shows that **baking was part of childhood itself** - children picked their bread-bangles carefully, so the baker was woven into daily family joy, not merely hired to supply bread. The bangles were shaped from bread, not sold as ornaments.',
  "What did the baker wear in the Portuguese days and in the writer's childhood, and what did the baker's plump physique show?":
    'In the Portuguese days the baker wore a single-piece long frock called the **kabai**, reaching to the knees; in the writer\'s childhood, a shirt and trousers just below the knees. His **plump, jackfruit-like body** was open testimony that baking was a profitable profession and his family never starved.',
  'In the chapter, the traditional Goan baker is called a:':
    '**Pader**. Peshkar, tandoor and kabai are not names for the baker - kabai is the frock he wore.',
  "'The Bangle Sellers' is a poem written by:":
    '**Sarojini Naidu**, the poet known as the Nightingale of India. The other names are Indian poets too, but not the author of this poem.',
  "Which food tradition in the chapter shows Goa's Portuguese heritage?":
    'The **sweet bread called pao**, along with the loaves and bolinhas - the baker\'s trade itself arrived with the Portuguese. Idli, sambar and tandoori roti belong to other regions.',
  "The baker's dress that the children remembered was the:":
    'The **kabai** - the long single-piece frock. Pader is the baker himself, not the garment.',
  'What does the poet compare the bangle sellers and their bangles to?':
    'She compares the bangles to the **stages of a woman\'s life** - a happy bride, a mature matron - and to the colours of the Indian landscape. The bangles carry the whole journey of Indian womanhood.',
  "What did the baker's bread mean to the children of Goa?":
    '**A special treat they waited for every morning** - the baker\'s horn and the bread-bangles were the high point of the day. It was not a punishment or something kept for festivals only.',
  "Which tradition in Goa is linked to its Portuguese past?":
    'The **baker\'s trade and the bread called "pao"** - the loaves, bolinhas and the kabai all came with the Portuguese. Gilli danda, Bihu and kabaddi belong to other regions and traditions.',
  "In the Goa section, what is a 'kabai'?":
    'The **long single-piece frock the baker wore**, reaching down to his knees - a Portuguese-era garment. It is not a basket, a sweet bread, a cap or an oven.',
  'Where did Gavin Maxwell go to collect his otter?':
    '**Basra, in Iraq** - he travelled there and was given an otter, which he named Mijbil. Nairobi, Camusfearna and London appear in the story for other reasons.',
  'Why had Maxwell not kept a dog after Jonnie?':
    '**Jonnie had died**, and Maxwell was too sad to think of keeping a dog again, even though life without a pet was lonely. That loneliness is what made an otter seem possible.',
  "Zoologists christened Mij 'Lutrogale perspicillata maxwelli'. What does this detail tell us?":
    'It tells us Mij belonged to **a kind of otter not described before**, so the subspecies was named after Maxwell. The naming is a small mark of how unusual his pet turned out to be.',
  "Why does the first-person narration make Mijbil's story convincing? Support your answer with one incident from the text.":
    'Maxwell narrates **what he himself saw and felt**, with exact personal details - Mij turning the chromium taps with his paws, playing with marbles - so the account reads like a true memoir rather than a report. The personal voice is what makes it convincing.',
  'Mijbil the otter was brought from:':
    '**Iraq** - Basra, specifically. Not England, Egypt or India.',
  'At the end of the chapter, Mij was sent to:':
    '**The zoo in London** - he outgrew the flat and had to be given to the zoo, which is the story\'s quiet sadness.',
  'The story of Mijbil is told in:':
    '**The first person, by the author himself** - "I" throughout. Not the otter\'s voice and not a third-person narrator.',
  "Mij's favourite game in the bathroom was playing with:":
    'Playing with **a ball** - he would send it rolling and pounce on it, along with turning the taps on and off.',
  'Why did Maxwell decide to keep an otter as a pet?':
    'He had **lost his dog**, and a friend suggested an otter; lonely without a pet, he decided to bring one back from Iraq.',
  'What did Mijbil do with the water in the bathroom?':
    '**He played in it and splashed it everywhere** - turning on the taps and revelling in the water until the bathroom was flooded.',
  "What is the effect of telling 'Mijbil the Otter' in the first person?":
    'It makes the writer\'s **affection and worry feel immediate and personal** - we share his anxiety on the plane and his delight at Mij\'s games. It does not hide the writer or give the otter\'s point of view.',
  "What does the word 'somersault' mean in the story?":
    '**A roll or tumble in which the body turns over completely** - exactly what Mij did as he played. It is not a cry, a fish or a sleeping place.',
  "How much was the bus fare from Valli's village to the town?":
    '**Thirty paise one way**, which is why she saved for weeks to cover the return trip too. Sixty paise is the round trip, not the single fare.',
  "How long did the bus journey from Valli's village to the town take?":
    '**Forty-five minutes** each way - which is exactly why she had to plan her day so carefully and be home before her mother noticed.',
  'Why did the sight of the dead cow on the roadside dampen Valli\'s enthusiasm?':
    'It was her **first close encounter with death**, and it made her suddenly aware of how fragile life is - a jarring note after the joy of the ride. She was not sorry about the money, the police, or who owned the cow.',
  'Describe what Valli saw from the window of the bus on her way to town.':
    'Along the bank of a canal she saw **palm trees, grassland, distant mountains and the blue sky** on one side, a deep ditch and green fields on the other, and further on a shopping street with glittering displays of clothes.',
  "How much did Valli's first bus ride cost her?":
    '**Thirty paise** each way, so sixty paise for the round trip - the money she had saved coin by coin over weeks.',
  'On her return journey, Valli was saddened by the sight of:':
    '**A dead cow lying by the road** - the same kind of cow she had admired on the way out, now lifeless. It is the moment the story turns from adventure to awareness.',
  'The bus conductor teasingly calls Valli:':
    '**Madam** - his mock-formal way of treating an eight-year-old as an honoured passenger, which she takes entirely seriously.',
  "Valli's favourite pastime was:":
    '**Standing at her doorway and watching the street** - the bus, the people, the everyday traffic. That is where the whole wish to ride begins.',
  'How do we know that Valli was a careful planner?':
    'She **saved her coins for weeks**, asked many questions about the bus, its fare and its timings, and timed the ride so she would be home before her mother noticed. Nothing about the trip was impulsive.',
  'What did Valli save her money for?':
    '**A bus ride to the town and back** - thirty paise each way. Not a dress, sweets or a present for her mother.',
  'What did Valli see on her second ride that changed her mood?':
    '**A young cow lying dead by the roadside**. She had seen a live cow on the way out, and the contrast brings home the reality of death.',
  "Which description shows the writer's eye for small detail?":
    'The conductor calling her **"madam"** and the canal running beside the road - small, concrete observations that make the scene real. "She was eight years old" is a fact, not the same kind of detail.',
  'For how many years did Gautama Buddha wander before he sat down under a peepal tree to meditate?':
    'He wandered for **seven years** before sitting under the peepal (bodhi) tree, where he attained enlightenment and became the Buddha.',
  'What did the Buddha ask Kisa Gotami to bring him?':
    '**A handful of mustard seeds from a house where no one had ever died**. The impossible condition is the lesson - such a house does not exist.',
  'Why did the Buddha send Kisa Gotami from house to house instead of simply telling her that death comes to everyone?':
    'He wanted her to **discover the truth for herself**, so the lesson would console her rather than merely inform her. Telling her outright would not have reached her grief.',
  "What do the villagers mean when they tell Kisa Gotami, 'the living are few, but the dead are many'?":
    'They mean that in almost every house someone has died, so **death is universal** and Kisa Gotami is not alone in her loss. Hearing it from every doorstep shows her that her grief had made her think only of her own child.',
  'Before he attained enlightenment, the Buddha was known as:':
    '**Prince Siddhartha Gautama**, who left his palace after seeing suffering, old age and death, and went in search of understanding.',
  'Kisa Gotami was asked to bring a handful of mustard seed from a house where:':
    '**No one had ever died** - she goes from door to door and fails everywhere, and that failure is the teaching.',
  'The central teaching of the sermon is that:':
    '**Death is common to all** and sorrow cannot be escaped by grieving - the living are few, the dead are many. Prayer alone, wealth or monkhood are not what the sermon is about.',
  "The word 'sermon' means:":
    '**A religious discourse** - a talk given to teach a moral or spiritual lesson. Not a farewell speech, a song of prayer or a letter.',
  'What did Kisa Gotami learn from the mustard seed lesson?':
    'She learned that **every house had lost someone**, so death is common to all and her grief was shared by everyone. Her sorrow turns into understanding rather than isolation.',
  'What did the Buddha ask the grieving woman to bring him?':
    '**A handful of mustard seeds from a house where no one had died** - not flowers, a lamp or a bowl of rice. The task is impossible, and that is the point.',
  'What is the main purpose of a sermon?':
    '**To teach a moral lesson and give comfort** - it addresses how to live and how to bear sorrow. It is not for jokes, royal news or political argument.',
  "What does 'sermon' mean?":
    '**A talk given on a moral or religious subject** - the word for the Buddha\'s address at Benares. Not a funeral song, a prayer book or a long journey.',
  "What is the 'proposal' that gives Chekhov's one-act play its title?":
    '**Lomov\'s request for Natalya\'s hand in marriage** - that is the reason for the visit, and everything else (Oxen Meadows, the dogs) is a detour away from it.',
  'How old were Ivan Lomov and Natalya Stepanovna?':
    '**Lomov was 35 and Natalya was 25**. Swapping the ages or adding five years are the easy errors - the play states both plainly.',
  'Why is the quarrel over Oxen Meadows and then over the two dogs funny on the stage?':
    'The neighbours **forget the proposal completely**, abuse each other over land and dogs, and then turn affectionate the moment marriage is mentioned again. Those rapid reversals are the comedy.',
  "Write the salutation, the main request and the closing of a short formal letter from Ivan Lomov to Stepan Chubukov asking for Natalya's hand in marriage.":
    '"Dear Sir, I have the honour to request the hand of your daughter, Natalya Stepanovna, in marriage; I shall be grateful for your consent. Yours faithfully, Ivan Vassilevitch Lomov." The salutation and closing are formal, the request is brief and polite, and the writer\'s full name ends it.',
  'Lomov comes to the house of Chubukov to propose to:':
    '**Natalya** - Chubukov\'s daughter. Not the doctor\'s daughter, a servant or his aunt.',
  "The play 'The Proposal' is set in:":
    '**Rural Russia** - Chubukov\'s country house and estate. Not Paris, London or central Moscow.',
  'The long quarrel between Lomov and Natalya is about:':
    '**The ownership of Oxen Meadows**, a strip of land each family claims. The two dogs become a second quarrel later in the play.',
  'A formal letter should end with:':
    '**Yours faithfully** - the standard formal close. "Yours lovingly", "see you soon" and "take care" belong in personal letters.',
  "Why is 'The Proposal' a comedy even though it is about marriage?":
    'The characters **keep quarrelling over small things** and insult each other while trying to be polite, so the audience laughs at their behaviour. The marriage is the excuse, not the subject.',
  "Why does Lomov come to Chubukov's house in 'The Proposal'?":
    '**To ask for Natalya\'s hand in marriage**. Not to complain about dogs, borrow money or buy the estate - those quarrels arise on the way.',
  'What does the quarrel between Lomov and Natalya show about them?':
    'That they **argue easily over small things but still agree to marry** - the joke is that neither of them is calm or particularly romantic.',
  'Which opening is correct for a formal letter?':
    '**Dear Sir or Madam,** - the formal salutation. "What\'s up", "hey there" and "hi buddy" belong in messages to friends.',
  'A scientific model is a __ way of looking at a real system.':
    'A model is a **simplified** way of looking at a real system: it keeps what matters for the question and leaves everything else out. A "complete" copy would be as complicated as the thing itself.',
  'In making a simple model of a cricket shot for a six, which details would you keep and which would you ignore?':
    'Keep the **mass of the ball and the speed and direction of the hit**, because those decide whether it crosses the boundary. Ignore the brand of the bat, the colour of the ball, the grass, the spin and the stitching - they make no difference to that question.',
  'In science, a theory is __.':
    'A theory is **an explanation based on evidence and careful testing** - a well-supported account of why something happens. It is not a law that can never change, a personal opinion or an untested guess.',
  'Why does science use standard SI units for quantities such as mass, length and time?':
    'So that **measurements made by different people in different places can be compared** without converting units. SI units do not remove uncertainty, do not make a measurement exact, and are the same everywhere rather than different by country.',
  'The speed of light is denoted by the symbol c. Why is this symbol used?':
    'It comes from the Latin **celeritas**, meaning speed. It does not stand for "constant", is not the first letter of a unit, and light does not travel in a circle.',
  'In science, a prediction is best described as':
    '**A reasoned expectation based on evidence, laws and models**. It is not a guess without evidence, not something untestable, and not a conclusion that later evidence cannot change.',
  'Why do scientists use models?':
    '**To simplify something too large or too small to observe directly** - an atom, a solar system, a cricket shot. A model never replaces real observation.',
  'Why is a standard unit needed in science?':
    'So that **measurements mean the same thing everywhere** - a metre in Delhi is the same metre in Paris. Shorter numbers, cheaper instruments or avoiding symbols are not the reason.',
  'What is a scientific law?':
    '**A statement of a pattern that holds every time it is tested** - it describes what happens. It is not an untested guess, one scientist\'s opinion or a rule made by a government.',
  'How does a scientific theory differ from a law?':
    'A **theory explains why**, a **law describes what happens**. A theory is not "always false" and a law is not untestable - they are different kinds of statement, not ranks of certainty.',
  'A good prediction in science is based on':
    '**Evidence and reasoning** - a reasoned expectation. Luck, a wish or a friend\'s opinion cannot make a prediction scientific.',
  'Why do scientists estimate a value before measuring it exactly?':
    '**To judge whether the final answer is reasonable** - an estimate catches a slipped decimal or a missing factor of ten. It is not a way to avoid instruments or a rule against exact values.',
  'Most plant and animal cells are best seen with a __ microscope.':
    'Ordinary plant and animal cells are large enough to see with a **light** microscope, which is why it is the standard classroom instrument. An electron microscope resolves far smaller structures but is not needed simply to see a cell.',
  'How can you estimate the real size of a cell seen under a microscope?':
    'Put a transparent ruler on the stage, focus and measure the diameter of the circular field of view in millimetres, then convert it to micrometres. Remove the ruler, focus on the onion peel, count the cells across the diameter and divide the field diameter by that number.',
  'The organelle called the powerhouse of the cell is the __.':
    'The **mitochondrion** releases energy from food by respiration, which is why it is called the powerhouse. The Golgi packages, lysosomes digest and ribosomes build proteins.',
  'Mitosis produces __ daughter cells from one parent cell.':
    'Mitosis gives **two genetically identical** daughter cells - the basis of growth and repair. Meiosis produces four different cells with half the chromosomes.',
  'Which statement is part of the classical cell theory?':
    '**All cells arise from pre-existing cells** - Virchow\'s addition to the theory. "All cells contain a nucleus" is false for bacteria, spontaneous generation is the opposite of the theory, and it is not limited to animal cells.',
  'A microscope magnifies 10x with the eyepiece and 40x with the objective. What is the total magnification?':
    'Magnifications multiply: 10 x 40 = **400x**. Adding them (50x) or multiplying incorrectly (4x) is the usual slip.',
  'Which structure is present in a plant cell but absent in an animal cell?':
    'The **cell wall** - a rigid layer outside the membrane. The nucleus, cell membrane and cytoplasm are found in both plant and animal cells.',
  "What is the main function of the cell membrane?":
    'It **controls what enters and leaves the cell** - a selectively permeable barrier. Making food is the chloroplast\'s work and colour comes from pigments, not the membrane.',
  'In mitosis, one cell divides to form':
    '**Two identical cells**. Four different cells is meiosis, and "one larger cell" or "no new cells" is not division at all.',
  'Why is meiosis important for reproduction?':
    'It **halves the chromosome number** in the gametes, so fertilisation restores the normal number. Doubling the chromosomes, stopping division or making identical body cells describes mitosis.',
  'What does the cell theory state?':
    '**All living things are made of cells, and new cells come from existing cells**. It is not limited to animals, it rules out cells arising from non-living matter, and it says nothing about every cell having a nucleus.',
  'Why is cell theory called a unifying principle?':
    'Because it **applies to every living organism** - plants, animals and bacteria alike. Who proposed it, or that a microscope is needed, is not what makes it unifying.',
  'The tissue that helps a plant grow in length is the __ meristem.':
    'The **apical** meristem at the tips of roots and shoots makes a plant grow longer. The lateral (cambium) meristem thickens it and intercalary meristem sits at the base of leaves and internodes.',
  'The annual growth rings seen in a cut tree trunk are produced by the __ meristem.':
    'Annual rings come from the **lateral** meristem - the cambium - which adds a new layer of xylem every year and thickens the stem. The apical meristem only lengthens the plant.',
  'Tendons connect __.':
    '**Muscles to bones**. Bone to bone is a ligament; nerve to muscle or skin to muscle are not what a tendon does.',
  'The cells of nervous tissue are called __.':
    '**Neurons**. Epithelial cells line surfaces, osteocytes are bone cells and chondrocytes are cartilage cells.',
  'Which plant tissue has thick walls due to lignin, is mostly made of dead cells, and makes stems and seed coats hard?':
    '**Sclerenchyma** has thick lignin-reinforced walls, is mostly dead at maturity and gives stems and seed coats their hardness. Collenchyma is living and flexible, parenchyma is thin-walled, and phloem transports food.',
  'Which feature of plant cells is chiefly responsible for the rigidity and strength of plant tissues?':
    'The **cell wall** - a rigid cellulose layer outside the membrane that resists stretching. The nucleus, cytoplasm and membrane provide no rigidity.',
  'Which type of joint allows movement in only one plane, as at the elbow and the knee?':
    'A **hinge joint** moves in one plane only. A pivot joint rotates, a ball and socket moves in all directions and a fixed joint does not move at all.',
  'How many pairs of ribs form the human rib cage?':
    '**12 pairs** - seven true pairs attached to the sternum, three false pairs and two floating pairs.',
  'Where is meristematic tissue found in a plant?':
    'At the **growing tips of roots and shoots** (and in the cambium), where new cells are produced. Not only in flowers, inside fruit, or in dry bark.',
  'Which tissue carries water up a plant\'s stem?':
    '**Xylem** carries water and dissolved minerals upward from the roots. Phloem carries food, and epithelial and muscle tissue are animal tissues.',
  'Which tissue carries food made in the leaves to other parts of the plant?':
    '**Phloem** carries the food made in the leaves to the rest of the plant. Xylem carries water upward, and nervous and connective tissue are animal tissues.',
  'Which animal tissue covers and protects body surfaces?':
    '**Epithelial tissue** covers and protects surfaces and lines cavities. Muscle contracts, nervous tissue conducts impulses and connective tissue supports and joins.',
  'Which type of joint allows movement in all directions?':
    'A **ball and socket joint**, as at the shoulder and the hip. Hinge and pivot joints allow movement in one plane or rotation only, and fixed joints do not move.',
  'Displacement is different from distance because displacement has __.':
    'Displacement has **direction as well as magnitude** - it is a vector, while distance is a scalar with size only. Both are measured in metres and both need a reference point; direction is the difference.',
  'An athlete runs 160 m once around a circular track and returns to the starting point. Her displacement is __.':
    'She finishes where she began, so the **displacement is 0 m**, while the distance travelled is 160 m. Displacement depends only on the start and end points, not the path.',
  'Write the three kinematic equations used for motion in a straight line with constant acceleration.':
    '**v = u + at**, **s = ut + ½at²** and **v² = u² + 2as**. Each links a different set of u, v, a, s and t, so you choose the one that contains the unknown you want.',
  'An athlete runs one complete round of a 400 m circular track in 40 s and returns to the starting point. What is the average velocity for the whole round?':
    'Average velocity = displacement / time, and a full round has zero displacement, so the average **velocity is 0 m/s**. The average *speed* would be 400/40 = 10 m/s - that difference is the point of the question.',
  "A car's velocity changes from 10 m/s to 20 m/s in 5 s. What is its average acceleration?":
    'a = (v - u)/t = (20 - 10)/5 = **2 m/s²**. Dividing by the wrong quantity or reversing the subtraction gives 0.5 or 10.',
  'What does the slope of a velocity-time graph represent?':
    'The slope is the change in velocity divided by time, which is **acceleration**. Displacement is the area under the graph, not the slope.',
  'What does the area enclosed between a velocity-time graph and the time axis represent?':
    'The area is velocity multiplied by time, which is **displacement**. The slope of the same graph is acceleration.',
  'Which quantity has both size and direction?':
    '**Displacement** is a vector. Distance, speed and time are scalars - they have size only.',
  'A car covers 120 km in 2 hours. What is its average speed?':
    'Average speed = distance / time = 120 / 2 = **60 km/h**. 240 comes from multiplying instead of dividing, and 30 from dividing twice.',
  'On a distance-time graph, a horizontal line means the object is':
    'The distance is not changing as time passes, so the object is **at rest**. A steeper line means faster motion and a downward slope means returning.',
  'In uniform circular motion, the speed is constant but the velocity changes because':
    'The **direction keeps changing**, and velocity is a vector, so it changes even at constant speed. The path is not straight, the mass does not change and time never stops.',
  'A body moving in a circle at constant speed has':
    '**Changing velocity**, because its direction changes, and therefore a non-zero acceleration towards the centre. Constant velocity would require a straight line.',
  'A well-stirred mixture of salt and water is a __ mixture.':
    '**Homogeneous** - the salt dissolves completely and the composition is the same throughout. A suspension or a colloid has separate particles that can be seen or that scatter light.',
  'The maximum amount of solute that dissolves in a fixed quantity of solvent at a given temperature is its __.':
    '**Solubility**. Concentration is how much is actually dissolved in this particular sample, density is mass per volume and volatility is how readily a liquid evaporates.',
  'The scattering of a beam of light by the particles of a colloid is called the __ effect.':
    'The **Tyndall** effect - colloidal particles scatter the beam so its path becomes visible. Refraction, dispersion and a mirage are different optical effects.',
  'Which of the following is a homogeneous mixture?':
    '**Salt dissolved in water** - one clear phase. Oil and water, chalk in water and sand in water all separate into visible phases.',
  'Which property is characteristic of a suspension?':
    'Its **solid particles are visible to the naked eye and settle on standing**, because they are large and heavy. Solutions have invisible particles that never settle.',
  'When sugar is dissolved in water to make a sugar solution, which substance is the solvent?':
    '**Water** - the component in the larger amount that dissolves the other. Sugar is the solute, and a solution cannot have two solvents by definition.',
  'If 10 g of salt is dissolved in 90 g of water, what is the mass by mass percentage of the solution formed?':
    'Mass % = (solute / solution) x 100 = 10/(10 + 90) x 100 = **10%**. Using 90 as the denominator gives 11.1% - the denominator is the whole solution.',
  'Which method is suitable for separating two miscible liquids whose boiling points differ by about 40 °C?':
    '**Distillation** - the liquid with the lower boiling point vaporises first and is condensed. Filtration, sublimation and chromatography do not separate miscible liquids by boiling point.',
  'In paper chromatography, on what does the separation of the components mainly depend?':
    'On **how strongly each component interacts with the solvent and with the paper**: the more soluble and less tightly held it is, the further it travels. Boiling point, mass alone and colour are not the mechanism - colour is just what you see.',
  'Which method separates a pure solid from its solution by slow cooling?':
    '**Crystallisation** - slow cooling lets pure crystals form while impurities stay in the solution. Filtration removes an insoluble solid and sublimation a volatile one.',
  'Chromatography is best for separating':
    '**Colours or dissolved substances that travel at different speeds** on the paper - inks, dyes and pigments. It cannot separate two insoluble solids, iron from sand, or oil from water.',
  'Which method separates two immiscible liquids like oil and water?':
    'A **separating funnel** - the liquids form two layers and the lower one is run off. Filter paper, a magnet and evaporation do not separate oil from water.',
  'Which change of state is used in sublimation?':
    '**Solid directly to gas**, without passing through the liquid state - as camphor and ammonium chloride do. Gas to liquid is condensation and liquid to gas is evaporation.',
  'Which of these is a homogeneous mixture?':
    '**Salt dissolved in water** - a single clear phase. Sand and water, oil and water, and iron filings with sulphur are heterogeneous mixtures.',
  'A heavy box is kept on a floor and a student pushes it horizontally, but the box does not move. Which statement correctly describes the forces on the box?':
    'The **friction balances the push**, so the net force is zero and the box stays at rest. Friction is not absent because the box is at rest - static friction is exactly what holds it there.',
  "State Newton's first law of motion. A puck slides across a frozen lake where friction is almost zero; use the law to describe how the puck moves after it has been pushed.":
    'An object at rest stays at rest, and an object in motion continues with the same velocity, **unless a net force acts on it**. With almost no friction no net force acts on the sliding puck, so it keeps moving in a straight line at constant velocity and does not slow down on its own.',
  'A fielder catches a fast-moving cricket ball by gradually pulling his hands backwards with the ball. Why does this reduce the force he has to apply to stop the ball?':
    'Pulling the hands back **increases the time** over which the ball stops, so the acceleration - and therefore the force needed - is smaller for the same change in momentum. The mass and the momentum change are unchanged.',
  'One newton is the force that produces an acceleration of 1 m s–2 on an object of mass':
    '**1 kg** - that is the definition of the newton. A gram or 100 g would need a far smaller force.',
  'A passenger standing in a bus tends to fall forward when the bus brakes suddenly. Why?':
    'The upper body **keeps moving with the earlier velocity** because of inertia while the bus slows, so it continues forward. The brakes do not push the passenger and inertia does not vanish when the bus slows.',
  'A net force of 20 N acts on a trolley of mass 5 kg. What is the acceleration of the trolley?':
    'a = F/m = 20/5 = **4 m/s²**. Multiplying instead of dividing gives 100 m/s².',
  'A rocket lifts off because':
    'The gases it expels downward **exert an equal and opposite upward force** on the rocket - Newton\'s third law. The rocket does not push on the air, gravity never pulls upward, and losing mass alone does not lift it.',
  'What can a force do to an object?':
    '**Change its speed, direction or shape**. A force does not change colour, and it does not create mass or raise temperature by itself.',
  'What is the SI unit of force?':
    'The **newton**. The joule is energy, the watt is power and the pascal is pressure.',
  'Friction always acts':
    '**Opposite to the direction of motion** (or of the attempted motion) - it opposes relative sliding. It is not only upward and not only on rough surfaces at rest.',
  'Why is oil used between moving machine parts?':
    '**To reduce friction** - the oil separates the surfaces so they slide over the lubricant instead of grinding against each other. Oil does not add weight or stop the parts moving.',
  "Newton's first law is also called the law of":
    '**Inertia** - the tendency of an object to keep doing what it was doing. Gravitation is a different law, and action and reaction is the third law.',
  'A constant force of 10 N moves a box through 2 m in the direction of the force. How much work is done by the force?':
    'W = F × s = 10 × 2 = **20 J** when the force and the displacement are in the same direction. Adding them (12 J) or ignoring the distance (0 J) is wrong.',
  'If the magnitude of the velocity of a moving vehicle is doubled, its kinetic energy becomes':
    'KE = ½mv², so kinetic energy grows as the **square** of the speed: doubling v makes KE **four times** as large. "Twice" is the classic error.',
  'Two students carry identical bags of books up the same flight of stairs. The first student takes 1 minute and the second takes 5 minutes. Is the work done by them the same? Who develops more power, and why?':
    '**Yes, the work is the same** - both raise the same load through the same height (W = F × s). The **first student develops more power**, because power is the rate of doing work and the same work in a shorter time is greater power.',
  'A person uses a crowbar to lift a heavy rock and places the fulcrum very close to the rock. Why does this make the rock easier to lift?':
    'The **effort arm becomes much longer than the load arm**, so a small effort produces a large force on the rock (mechanical advantage greater than 1). The work needed is not reduced - only the force - and the rock\'s weight does not change.',
  'Work is done when a force moves an object':
    '**In the direction of the force** - W = F s cos θ, maximum at 0° and zero at 90°. Being heavy or being at rest does not create work.',
  'A force of 10 N moves a box 3 m. How much work is done?':
    'W = F × s = 10 × 3 = **30 J**. 13 is adding the numbers instead of multiplying them.',
  'Energy stored in a stretched rubber band is':
    '**Potential energy** - elastic potential energy stored by the deformation. Kinetic energy is the energy of motion, and heat and sound are other forms.',
  'Kinetic energy of a body depends on its':
    '**Mass and speed** (KE = ½mv²). Colour, shape, temperature and height are not part of it - height belongs to gravitational potential energy.',
  'Power is the rate of':
    '**Doing work** - P = W/t. Not changing shape, gaining mass or losing heat.',
  'The SI unit of power is':
    'The **watt** - one joule per second. The joule is work, the newton is force and the ampere is current.',
  'A single fixed pulley changes':
    'A fixed pulley changes the **direction of the force**, not its size: the effort still equals the load. It does not change the work done or the mass.',
  'A ramp makes work easier because it':
    'It **spreads the effort over a longer distance** - the same work done with a smaller force over a longer path. It does not reduce the weight, remove friction or reduce the work.',
  'In the gold foil experiment, most alpha particles passed straight through the foil, while a few were deflected through large angles and some even bounced back. What did Rutherford conclude from these observations?':
    'That the **positive charge and most of the mass are concentrated in a very small central nucleus**. Most particles pass through the empty space, a few are deflected by the nucleus and some bounce back; a uniformly spread positive charge could not deflect any of them sharply.',
  "In Bohr's model of the atom, which shell lies closest to the nucleus and has the least energy?":
    'The **K shell (n = 1)** is closest to the nucleus and has the lowest energy. Energy increases as the shell number increases.',
  'An atom of an element has atomic number 17 and mass number 35. Find the number of protons, electrons and neutrons in it.':
    'Atomic number = protons = **17**, and a neutral atom has **17 electrons**. Neutrons = mass number - protons = 35 - 17 = **18**.',
  'Chlorine occurs in nature as about 75% of chlorine-35 and 25% of chlorine-37, so its average atomic mass is 35.5 u. A student says that this means many chlorine atoms have a mass of 35.5 u. What is the correct explanation?':
    '**No single chlorine atom has a mass of 35.5 u** - it is the **weighted average** of the isotopes (75% Cl-35, 25% Cl-37) over a large sample. Equal numbers would average 36, and the plain arithmetic mean also gives 36 because it ignores the abundances.',
  'What did Rutherford conclude from the gold foil experiment?':
    'That the **positive charge and most of the mass of an atom are concentrated in a tiny nucleus**, with electrons in the surrounding space. Not a uniform positive sphere (Thomson\'s model) and not indivisible atoms.',
  "In Bohr's model of the atom, what happens when an electron moves from the K-shell to the L-shell?":
    'Moving to an outer shell means moving to a higher energy level, so the electron **absorbs a fixed amount of energy** equal to the difference between the two levels. It does not settle between shells or lose energy continuously.',
  'What is the electronic configuration of chlorine (atomic number 17)?':
    '**2, 8, 7** - seventeen electrons fill the K shell (2), the L shell (8) and then seven in M. 2, 8, 8 is argon, the next element.',
  'An atom has 11 protons, 12 neutrons and 11 electrons. What is its atomic number?':
    '**11** - the atomic number is the number of protons (sodium). 23 is the mass number and 12 is the neutron count.',
  'An atom contains 17 protons and 18 neutrons. What is its mass number?':
    'Mass number = protons + neutrons = 17 + 18 = **35**. 17 is the atomic number and 18 is only the neutrons.',
  "What did Rutherford's gold foil experiment show?":
    'That the atom has a **small, dense nucleus** - the result that replaced the plum-pudding model. It did not show that atoms are indivisible or that electrons are positive.',
  'Isotopes of an element have the same number of':
    '**Protons but different numbers of neutrons**. The proton count is what identifies the element; a different number of protons would be a different element.',
  'Isobars are atoms with the same':
    '**Mass number but different atomic numbers** - different elements with the same total of nucleons, such as Ar-40 and Ca-40.',
  'In a closed container, 4.0 g of calcium carbonate reacts completely with 2.92 g of dilute hydrochloric acid. The products are 1.76 g of carbon dioxide, 0.72 g of water and calcium chloride. What mass of calcium chloride is formed?':
    'Total mass in = 4.0 + 2.92 = 6.92 g. The other products weigh 1.76 + 0.72 = 2.48 g, so calcium chloride = 6.92 - 2.48 = **4.44 g** - conservation of mass in a closed container.',
  'Pure water obtained from a river, a borewell or the ocean always contains hydrogen and oxygen in which fixed ratio by mass?':
    'Water is H2O: 2 parts hydrogen to 16 parts oxygen, i.e. **1 : 8** by mass. 2 : 1 is the ratio of *atoms*, not of masses - the classic confusion.',
  'Sodium has the electronic configuration 2, 8, 1 and chlorine has 2, 8, 7. Explain how sodium chloride is formed by the transfer of electrons, and name the ions produced.':
    'Sodium **loses its single valence electron** and becomes Na+ (11 protons, 10 electrons); chlorine **gains that electron** and becomes Cl- (17 protons, 18 electrons). The oppositely charged ions attract each other electrostatically - an **ionic bond** - giving the compound NaCl.',
  'What is the formula unit mass of magnesium hydroxide, Mg(OH)2? (Atomic masses: Mg = 24 u, O = 16 u, H = 1 u)':
    'Mg 24 + 2 × (O 16 + H 1) = 24 + 2 × 17 = **58 u**. Ignoring the bracket (24 + 16 + 2 = 42) or forgetting that there are two OH groups gives the wrong values.',
  'The atomic masses of carbon and oxygen are 12 u and 16 u. What is the molecular mass of carbon dioxide (CO2)?':
    '12 + 2 × 16 = **44 u**. 32 u is only the two oxygen atoms.',
  'What is the chemical formula of aluminium oxide?':
    'Aluminium has valency 3 and oxygen 2, so the charges balance in **Al2O3** (2 × 3 = 3 × 2). AlO leaves the charges unequal.',
  'What is the chemical formula of magnesium hydroxide?':
    'Magnesium has valency 2 and the hydroxide ion carries charge 1, so two OH groups are needed: **Mg(OH)2**. The bracket matters - MgOH2 is a different (and wrong) formula.',
  'Which equation is correctly balanced for the complete combustion of methane?':
    '**CH4 + 2O2 -> CO2 + 2H2O** balances 1 C, 4 H and 4 O on both sides. CH4 + O2 leaves oxygen short, and a CO product means incomplete combustion.',
  'In a closed container, 4 g of hydrogen reacts completely with 32 g of oxygen. What mass of water forms?':
    'By conservation of mass the product weighs the sum of the reactants: 4 + 32 = **36 g**. Nothing is lost in a closed container.',
  'The law of constant proportions says a compound always contains':
    '**The same elements in the same ratio by mass**, whatever its source - water is 1:8 hydrogen to oxygen whether it comes from a river or the sea.',
  'An ionic bond forms when':
    '**Electrons are transferred** from one atom to another, producing oppositely charged ions that attract. Sharing equally is covalent; protons are never shared and nuclei are never lost.',
  'Water always contains hydrogen and oxygen in the mass ratio':
    '**1 : 8** - 2 g of hydrogen to 16 g of oxygen in every 18 g of water. 2 : 1 is the ratio of atoms, not of masses.',
  'A covalent bond forms when atoms':
    '**Share electrons**. Sharing protons, losing neutrons or transferring electrons completely describes no real bond - complete transfer would be ionic.',
  'What are the two sides of the U-shaped bar of a tuning fork called?':
    'The **prongs (tines)** - the two arms of the U. The stem is the handle, nodes are points that do not vibrate, and a diaphragm belongs to a loudspeaker.',
  'In the vacuum bell jar experiment, the sound of the ringing electric bell becomes fainter as air is pumped out of the jar. What does this experiment show?':
    'That **sound needs a medium to propagate**: with fewer air particles there is nothing to carry the vibration, so the sound fades. Sound cannot travel in a vacuum at all, and it does travel through solids and liquids.',
  'A person claps in an empty corridor and hears an echo 0.5 s later. If the speed of sound in air is 340 m/s, how far is the person from the wall?':
    'The sound travels to the wall **and back**, so the distance is (340 × 0.5)/2 = **85 m**. Forgetting to halve the distance gives 170 m.',
  'Define the frequency and the time period of a sound wave, and state how they are related.':
    '**Frequency** is the number of oscillations per unit time (SI unit hertz); **time period** is the time for one complete oscillation (SI unit second). Frequency = **1 / time period**, so a shorter time period means a higher frequency.',
  'Sound is produced by':
    '**A vibrating body**. A stationary, hot or heavy object makes no sound unless something vibrates.',
  'A tuning fork produces sound because its prongs':
    'The prongs **vibrate rapidly**, pushing the air into compressions and rarefactions. They do not get hot, change colour or become heavier.',
  'Why can we not hear sound on the Moon?':
    '**There is no air to carry the sound** - the Moon has essentially no atmosphere, so there is no medium for the vibration. Distance and temperature are not the reason.',
  'Sound travels fastest in':
    '**Solids**, where the particles are closest together and pass the vibration on fastest; then liquids, then gases. Sound cannot travel in a vacuum at all.',
  'The number of vibrations per second is called':
    '**Frequency**, measured in hertz. Amplitude gives loudness, wavelength the distance between compressions, and speed how fast the wave travels.',
  'A sound with a higher amplitude is':
    '**Louder**. Amplitude controls loudness, while frequency controls pitch - a higher frequency is shriller, not louder.',
  'An echo is heard when':
    '**Sound reflects back after hitting a hard surface** and reaches the ear after a delay. Absorption, a vacuum or a stopped source produce no echo.',
  'Ultrasonic sound has a frequency':
    '**Above the range of human hearing** (above about 20 kHz). Below 20 Hz is infrasonic, and zero is not a sound at all.',
  'In which of the following organisms does a bud grow on the parent body and then separate to live independently?':
    '**Hydra** - a bud grows on the body, develops tentacles and detaches. Bread mould forms spores, Bryophyllum grows plantlets on its leaves, and Amoeba divides in two.',
  'In which method of vegetative propagation is the middle part of a flexible twig buried under the soil until roots develop?':
    '**Layering** - the middle of a flexible twig is buried until it roots, then separated from the parent. A cutting is a detached stem, grafting joins a scion to a stock, and tissue culture grows plants from cells.',
  'A gardener removes the stamens from a flower bud and covers the bud with a muslin cloth bag. No fruit forms in place of that flower. What does this show?':
    'That **pollen must be transferred from the anther to the stigma** for fruit to form. Removing the stamens removes the pollen source, so fertilisation cannot happen - the bag alone does not prevent fruit.',
  'How many chromosomes are present in a human body cell and in a human gamete? Why is the number in the gamete half of this?':
    'A human body cell has **46 chromosomes (23 pairs)**; a sperm or egg has **23**, because gametes are formed by **meiosis**, which halves the number. When the two gametes fuse, the zygote is back to 46.',
  'What are gametes?':
    '**Reproductive cells that fuse during fertilisation** - sperm and egg. Body cells divide by mitosis, hormones are not gametes, and supporting tissue is not either.',
  'Fertilisation is the fusion of':
    '**A male gamete and a female gamete**. Fusing two body cells, two embryos or two zygotes is not fertilisation.',
  'Asexual reproduction produces offspring that are':
    '**Genetically identical to the parent**, because only one parent is involved and no gametes fuse. Variation comes with sexual reproduction.',
  'Which of these reproduces asexually?':
    '**A potato growing from an eye** - a tuber sprouting is vegetative reproduction. A mango seed, a chick from an egg and a human baby all arise from fertilisation.',
  'Vegetative propagation uses which part of a plant?':
    '**Roots, stems or leaves** - not seeds, flowers or pollen. Potato (stem), sweet potato (root) and Bryophyllum (leaf) are examples.',
  'Why do farmers use vegetative propagation for sugarcane?':
    'It gives **quick plants identical to the parent**, so a good variety is preserved exactly. It still needs water, does not create new varieties and does not stop pests by itself.',
  'Pollination is the transfer of pollen from':
    '**The anther to the stigma**. The reverse is not pollination, and roots, leaves, ovaries and sepals are not involved.',
  'After fertilisation, the ovary of a flower develops into':
    '**The fruit**. The ovules become the seeds, the petals fall and the pollen has already done its job.',
  'Species that are found only in a particular region and nowhere else in the world are called':
    '**Endemic species**. Endangered means at risk of extinction, migratory means it moves with the seasons, and extinct means it is gone.',
  'Bacteria and cyanobacteria are single-celled prokaryotes. In the five kingdom classification they are placed in the kingdom':
    '**Monera** - the kingdom of prokaryotes, which have no nucleus. Plantae, Protista and Fungi all have eukaryotic cells.',
  'A student writes the scientific name of the lion as Panthera Leo. What is wrong with the way this name is written?':
    'The **species name must begin with a small letter**, so it is *Panthera leo*. The two words stay separate, the genus is capitalised, and only the genus takes a capital.',
  'State any two ways in which biological classification helps us.':
    'It makes the study of organisms **organised and systematic**, and it shows the **similarities, differences and relationships** among them. It also gives every organism a stable name that scientists everywhere can use.',
  'What is a biodiversity hotspot?':
    'A region with **many species found nowhere else and under threat** - high endemism combined with habitat loss. Not a place with one species, a cold desert or an area without forests.',
  'Why is India rich in biodiversity?':
    'Because it has **many climate zones and habitats** - mountains, deserts, coasts and rainforests. Not one forest type, no deserts, or being an island.',
  'Why do scientists classify living things?':
    'To **group organisms by shared features and study them easily**. Not to make them look neat, give them numbers or reduce the number of species.',
  'Which is the smallest and most specific group in classification?':
    '**The species** - the most specific rank. Kingdom is the broadest, and class and order sit in between.',
  'Which kingdom includes mushrooms and moulds?':
    '**Fungi** - they absorb nutrients from dead matter. Monera are bacteria, Protista single-celled eukaryotes and Plantae plants.',
  'Bacteria belong to which kingdom?':
    '**Monera**. Fungi, Protista and Animalia all have eukaryotic cells.',
  'In binomial nomenclature, the first word of a scientific name is the':
    '**Genus**, written with a capital; the second word is the species, in lower case.',
  'What is the main threat to biodiversity today?':
    '**Habitat loss caused by human activity**. Too many species, the rotation of the Earth and scientific naming are not threats.',
  'The fraction of the solar radiation falling on a surface that is reflected back by that surface is called its':
    '**Albedo** - the fraction of incoming solar radiation a surface reflects. Insolation is incoming solar energy, the solar constant is its value at the top of the atmosphere, and the greenhouse effect is the trapping of outgoing heat.',
  'The rotation of the Earth makes the planetary winds in the Northern Hemisphere bend towards which side of their path?':
    '**Towards the right** in the Northern Hemisphere (the Coriolis effect), and towards the left in the Southern Hemisphere. The deflection does not change with the season.',
  'Nitrogen gas makes up most of the atmosphere, yet plants cannot use it directly. Explain how nitrogen-fixing bacteria and nitrifying bacteria together make nitrogen available to plants.':
    '**Nitrogen-fixing bacteria** (Rhizobium in legume root nodules, Azotobacter in soil) convert N2 into ammonia. **Nitrifying bacteria** then turn that into nitrates - Nitrosomonas makes nitrite and Nitrobacter makes nitrate - and plants absorb the nitrates. Animals get their nitrogen by eating plants or other animals.',
  'Fertiliser runoff from farmland enters a lake. Thick mats of algae spread over the surface and, some weeks later, most of the fish in the lake are dead. Which statement best explains what has happened?':
    '**Eutrophication**: the extra nitrate feeds an algal bloom, and when the algae die their decay uses up the dissolved oxygen, so the fish suffocate. Denitrification, nitrification and leaching do not account for the dead fish.',
  'Why is the equator hotter than the poles?':
    '**Sunlight falls more directly** there, so the same energy is spread over a smaller area. The equator is not closer to the Sun and does not spin faster.',
  'Uneven heating of the Earth is the main cause of':
    '**Winds and ocean currents** - it sets up pressure differences and moves heat around the planet. Earthquakes, volcanoes and the seasons have other causes.',
  'What mainly drives winds?':
    '**Differences in air pressure caused by uneven heating**. The Moon\'s gravity drives the tides, not the winds.',
  'Ocean currents help to':
    '**Move heat from warmer to cooler regions**, which moderates the climate. They do not stop tides, cause earthquakes or freeze the equator.',
  'In the water cycle, water vapour cools and changes back to liquid by':
    '**Condensation** - vapour cools into liquid droplets. Evaporation is the opposite, precipitation is falling rain or snow, and transpiration is water lost by plants.',
  'Which process removes carbon dioxide from the atmosphere?':
    '**Photosynthesis** - plants take in CO2 and release oxygen. Respiration, burning fuels and decomposition all add CO2.',
  'Burning fossil fuels mainly increases which gas in the air?':
    '**Carbon dioxide** - the main product of combustion. Nitrogen, oxygen and argon are not produced by burning.',
  'Which human activity most directly pollutes rivers?':
    '**Releasing untreated sewage** into them. Planting trees on the banks, check dams and rainwater harvesting protect a river rather than pollute it.',
  'The coordinates of the origin O are __.':
    'The origin is **(0, 0)** - the point where the two axes meet, so both the x and the y distance are zero.',
  'A point on the x-axis 4.5 units to the right of the origin has coordinates __.':
    '**(4.5, 0)** - a point on the x-axis has y = 0, and "to the right" means positive x. (0, 4.5) would be up the y-axis and (-4.5, 0) would be to the left.',
  'Find the distance between the points A(3, 4) and D(7, 1).':
    'Along x: 7 - 3 = 4; along y: 4 - 1 = 3. Distance = √(4² + 3²) = √25 = **5 units** - the Baudhayana-Pythagoras relation applied to the two legs.',
  'In which quadrant of the Cartesian plane does the point (-7, 5) lie?':
    'x is negative and y is positive, so it lies in **Quadrant II**. Quadrant I is (+,+), III is (-,-) and IV is (+,-).',
  'In the ancient geography described in the chapter, which city was used as the zero-longitude reference from which all other locations were measured?':
    '**Ujjayini** (modern Ujjain) - the ancient Indian prime meridian described in the chapter. Lothal and Harappa are Indus Valley sites and Taxila a city, not the reference.',
  'Which handheld instrument did Al-Biruni perfect so that sailors could find their coordinates by looking at the stars?':
    'The **astrolabe**, which measures the angle of a star above the horizon and so gives latitude. The magnetic compass, sextant and telescope are different instruments.',
  'What is the point of intersection of the x-axis and y-axis called?':
    'The **origin**. The abscissa is the x-coordinate, the ordinate the y-coordinate, and a quadrant is one of the four regions.',
  'What are the coordinates of the origin?':
    '**(0, 0)** - at the intersection of the axes both coordinates are zero.',
  'In which quadrant are both coordinates positive?':
    '**The first quadrant** (+, +). The second is (-, +), the third (-, -) and the fourth (+, -).',
  'In which quadrant is the point (-3, 5)?':
    '**The second quadrant** - x is negative and y is positive.',
  'The distance between (1, 2) and (4, 6) is':
    '√((4 - 1)² + (6 - 2)²) = √(9 + 16) = √25 = **5**. 25 is the square of the distance and 7 is the sum of the coordinate differences.',
  'The distance of the point (3, 4) from the origin is':
    '√(3² + 4²) = √25 = **5**. 7 comes from adding the coordinates instead of squaring them.',
  'Who is credited with developing coordinate geometry?':
    '**René Descartes**, who joined algebra and geometry through the coordinate plane. Newton, Aryabhata and Euclid worked in other areas.',
  'How do maps and GPS use coordinates?':
    'They give each place **a pair of numbers that locates it** - latitude and longitude. They are not just place names, they do not measure road distance, and they cannot work without a reference point.',
  'In the expression 4x + 5y + 3, the numbers 4 and 5 are called the __.':
    'They are the **coefficients** - the numbers multiplying the variables. The constants are the fixed numbers (3), exponents are the powers and terms are the pieces being added.',
  'The polynomial 3z + 7 has degree __.':
    '**1** - the highest power of the variable is 1, which is exactly what makes it linear.',
  'The graph of a linear polynomial in one variable is always a __.':
    '**A straight line** - a linear function changes at a constant rate, so its graph has a constant slope.',
  'A tank contains 500 litres of water and drains at a steady 12 litres per hour. Which expression gives the number of litres left after t hours?':
    '**500 - 12t** - the amount falls by 12 litres each hour. "12t - 500" goes negative immediately and "500 + 12t" would mean the tank is filling.',
  'What is the degree of the polynomial 5 - 2x^2 + x^4?':
    '**4** - the highest power is x⁴. The 2 is another power present and the 5 is the constant term.',
  'What is the coefficient of x^2 in the polynomial 3x^3 - 7x^2 + 2x - 5?':
    '**-7** - the coefficient carries its sign. Writing 7 leaves the minus behind.',
  'In 7x - 4, what is the coefficient of x?':
    '**7**. The -4 is the constant term, not a coefficient of x.',
  'In 7x - 4, what is the constant term?':
    '**-4** - the term without a variable, including its sign. 7 is the coefficient of x.',
  'What is the degree of a linear polynomial?':
    '**1** - by definition a linear polynomial has degree 1, which is why its graph is a straight line.',
  'Which of these is a linear polynomial?':
    '**3x + 2** has degree 1. x² + 1 is quadratic, x³ is cubic and 5 is a constant polynomial.',
  'A taxi charges 50 rupees plus 10 rupees per km. Which expression gives the fare for k km?':
    '**50 + 10k** - a fixed charge plus ten rupees for every kilometre. "60k" would charge 60 for every kilometre, including a fixed part.',
  'A tank has 200 litres and drains 20 litres per minute. How much is left after m minutes?':
    '**200 - 20m** - the volume falls by 20 litres each minute. "200 + 20m" would mean the tank is filling.',
  'The graph of a linear polynomial is always':
    '**A straight line** - a constant rate of change. A parabola comes from a quadratic, and a circle from x² + y² = r².',
  'For y = 2x + 1, what is y when x = 3?':
    'y = 2(3) + 1 = **7**. Forgetting the +1 gives 6.',
  'The Lebombo bone carries an early record of __ carved on it.':
    '**Tally marks** - early counting carved into bone. Not cuneiform letters, decimal places or negative numbers.',
  'The Indian mathematician who formalised zero and negative numbers as algebraic entities was __.':
    '**Brahmagupta**, in the seventh century. Madhava, Baudhayana and Aryabhata worked on other problems.',
  'The decimal expansion 0.142857142857... shows the cyclic number __.':
    '**142857** repeats - the famous cyclic number, which is the decimal form of 1/7. The other options are rotations of the same digits, not the repeating block.',
  'In the Bakhshali Manuscript, the number zero is represented by ___.':
    '**A bold dot (bindu)** - the earliest written zero, which came before the small circle. Not a blank space or the word "shunya".',
  "Using Brahmagupta's rules for zero, find the value of (-9) x 0 + 0 - (-4).":
    '(-9) × 0 = 0, then 0 + 0 = 0, and 0 - (-4) = **4** - subtracting a negative adds. Stopping at 0 forgets the last step.',
  'How many rational numbers lie strictly between 1/3 and 1/2?':
    '**Infinitely many** - the rationals are dense, so between any two there is always another. "Exactly one" or "none" is the intuition the chapter corrects.',
  'What is one-to-one correspondence in early counting?':
    '**Matching one object with one mark** - the earliest counting, long before number words. Not counting in tens, writing words or using a calculator.',
  'Why did early people use tally marks and knots?':
    '**To keep records of counted things** - sheep, grain, days. They were not decoration, stories or a way to measure length.',
  'Which number lies between 1/3 and 1/2?':
    '**5/12 ≈ 0.417** lies between 0.333 and 0.5. A quarter (0.25) is too small, and 3/4 and 2/3 are too large.',
  'Rational numbers are called dense because':
    '**Between any two of them there is always another** - that is what dense means. They are not heavy, they can be written as fractions, and there are infinitely many of them.',
  'Which of these is an irrational number?':
    '**The square root of 2** - it cannot be written as a fraction of integers. 3/4, 0.25 (= 1/4) and -7 are all rational.',
  'A decimal that repeats a block of digits for ever is called':
    '**A recurring decimal**. A terminating decimal stops, and an irrational decimal neither terminates nor repeats.',
  '(a + b) squared is equal to __.':
    'Multiply (a + b)(a + b) term by term: a times a, a times b, b times a, then b times b, giving **a^2 + 2ab + b^2**. The tempting answer a^2 + b^2 drops the two ab rectangles that appear when each part of the first bracket meets each part of the second. The version with a minus sign belongs to (a - b)^2, not to (a + b)^2.',
  'Using the identity (x + a)(x + b), the expression x squared + 7x + 12 can be written as __.':
    'You need two numbers that multiply to **12** and also add to **7**, and 3 with 4 does both, so the factors are (x + 3)(x + 4). Choosing 2 and 6 passes the product test but adds to only 8, which is the usual slip: both conditions must hold. The pair -3 and -4 is wrong because two negative factors would give -7x, not +7x.',
  'How can you simplify a rational expression in which the numerator and the denominator have a common factor?':
    'A common factor can be cancelled because dividing the top and bottom by the same non-zero quantity leaves the value unchanged, so cancel it and keep the **simplest form**. For example (x^2 - 4)/(x - 2) becomes (x - 2)(x + 2)/(x - 2) = x + 2. Squaring the parts or adding terms changes the value, so factorise first and cancel only whole factors.',
  'A square of side (a + b) is divided into two squares of areas a^2 and b^2 and two equal rectangles. If a = 4 and b = 3, what is the total area of the two rectangles?':
    'Each rectangle has area ab = 4 × 3 = 12, and two of them make **24**. Stopping at 12 counts only one rectangle and forgets its twin on the other side of the square. The 25 is a^2 + b^2 = 16 + 9, which is just the two corner squares, while 49 is the whole square, (a + b)^2 = 7^2.',
  'Using the identity (a - b)^2 = a^2 - 2ab + b^2, expand (2x - 3)^2.':
    'Here a = 2x and b = 3, so a^2 = 4x^2, 2ab = 2 × 2x × 3 = **12x**, and b^2 = 9, giving 4x^2 - 12x + 9. The answer 4x^2 - 6x + 9 squares the 2 but forgets to double the middle product. The plus version 4x^2 + 12x + 9 would be the expansion of (2x + 3)^2, so its sign is the giveaway.',
  'Factorise x^2 - 5x + 6.':
    'The two numbers must multiply to **+6** and add to **-5**, and -2 with -3 satisfies both. The pair +2 and +3 multiplies correctly but adds to +5, which would flip the middle term to +5x. The pair -1 and -6 adds to -7, so it cannot rebuild -5x even though the product is right.',
  'Which identity gives (a + b)^2?':
    'Squaring a binomial means multiplying it by itself, so (a + b)(a + b) = a^2 + ab + ba + b^2 = **a^2 + 2ab + b^2**. Writing only a^2 + b^2 loses the two ab terms, which is the most common error. The identity containing a minus sign before 2ab describes (a - b)^2 instead.',
  'Which identity gives (a + b)(a - b)?':
    'Expanding gives a^2 - ab + ab - b^2, and the two middle terms cancel because they are equal and opposite, leaving **a^2 - b^2**. Keeping them as +2ab is the mistake behind a^2 + 2ab + b^2, which comes from (a + b)^2. This shortcut needs one bracket with a plus and one with a minus.',
  'The identity (a + b)^2 can be shown as the area of':
    'A square of side (a + b) can be cut into a square a^2, a square b^2 and two rectangles of area ab each, so all four pieces give **a^2 + 2ab + b^2**. A single rectangle of area ab is only one of those pieces, so it cannot show the whole identity. A circle or a triangle has curved or sloping sides and cannot be split into these exact pieces.',
  'In the square diagram for (a + b)^2, the two rectangles each have area':
    'The big square has side (a + b), so each rectangle measures a by b and its area is **ab**; two of them supply the 2ab term. The pieces of area a^2 and b^2 are squares in the corners, not rectangles, because their sides are equal. Writing 2ab + a adds an area to a length, so the units no longer match.',
  'Factorise x^2 - 9 using an identity.':
    'This is a difference of two squares, since 9 = 3^2, and a^2 - b^2 factorises as (a - b)(a + b), so here it is **(x - 3)(x + 3)**. The answer (x - 3)^2 expands to x^2 - 6x + 9, which brings back a middle term that should be zero. Splitting 9 as -9 and +1 gives -8x in the middle, so it fails too.',
  'Factorise x^2 + 6x + 9.':
    'Both ends are perfect squares, x^2 and 3^2, and the middle 6x equals 2 × x × 3, so the expression is the perfect square **(x + 3)^2**. Writing (x - 3)^2 would put -6x in the middle, which has the wrong sign. The pair 9 and 1 multiplies to 9 but adds to 10, not 6.',
  'Simplify (x^2 - 4) / (x - 2).':
    'Factorise the top as (x - 2)(x + 2), then cancel the common bracket (x - 2) with the bottom, leaving **x + 2**. Answering x - 2 cancels nothing and simply repeats the bracket that was removed. Leaving x^2 or writing 2 ignores the division; note also that x cannot be 2, because the bottom would then be zero.',
  'Before cancelling in a rational expression, you must':
    'You can only cancel something that is a factor of the whole numerator and the whole denominator, so **factorise both** first. For instance (x^2 - 1)/(x - 1) shows nothing useful until the top becomes (x - 1)(x + 1). Squaring both parts or adding terms changes the value instead of simplifying, which is why those shortcuts fail.',
  'What is the greatest possible length of a chord of a circle of radius 10 cm?':
    'The longest chord is the one through the centre, the diameter, and it measures 2 × 10 = **20 cm**. Reporting 40 cm doubles the radius twice, since 40 cm would be four radii. The 10 cm answer gives the radius itself, and any chord that misses the centre is shorter than the diameter.',
  'How many lines of symmetry does a circle have?':
    'Any line through the **centre** folds a circle exactly onto itself, and there is one such line for every direction, so the number is infinitely many. Saying 4 or 2 usually comes from picturing a square or a rectangle, which do have a small fixed number of folds. A circle has no corners to limit the choice of crease.',
  'A chord of length 16 cm is 6 cm away from the centre of a circle. What is the radius of the circle?':
    'The perpendicular from the centre bisects the chord, so half the chord is 8 cm, and r^2 = 6^2 + 8^2 = 36 + 64 = 100, giving **r = 10 cm**. The 14 cm comes from adding 6 + 8 instead of using Pythagoras. Using the full 16 in place of the 8 cm half-chord would give a radius of about 17 cm.',
  'ABCD is a cyclic quadrilateral with ∠A = 95° and ∠B = 70°. Find ∠C and ∠D.':
    'Opposite angles of a cyclic quadrilateral are supplementary, so angle C = 180 - 95 = **85 degrees** and angle D = 180 - 70 = 110 degrees. Treating A and B as an opposite pair would wrongly make C equal to 70. Subtracting from 360 gives the correct total for C and D but says nothing about each one separately.',
  'A chord that passes through the centre of a circle is called':
    'A chord joins two points on the circle, and when it passes through the centre it is the longest one, called a **diameter**. A radius runs from the centre to just one point on the circle, so it is not a chord at all. A tangent touches the circle at a single point and never crosses it, and an arc is part of the curved edge.',
  'How is the diameter related to the radius?':
    'The diameter is a chord through the centre made of two radii placed end to end, so d = **2r**. Saying the diameter is half the radius reverses the relation and would make the longer line shorter than the part. The square of the radius is not even a length, so d = r^2 cannot describe a distance.',
  'Every line of symmetry of a circle passes through':
    'Folding a circle in half only matches the two halves when the crease passes through the **centre**, so every line of symmetry does. A crease through a random point on the circle, or along a chord that misses the centre, leaves unequal arcs on the two sides. That freedom of direction is also why there are infinitely many such lines.',
  'The perpendicular from the centre of a circle to a chord':
    'Joining the centre to the two ends of the chord gives an isosceles triangle with two radii, so the perpendicular from the centre lands on the midpoint and **bisects** the chord. This is the fact that lets you find a radius with Pythagoras. A perpendicular cannot be parallel to the chord, and if it missed the chord there would be nothing to bisect.',
  'The perpendicular bisector of a chord always passes through':
    'Every point on the perpendicular bisector of a chord is equally far from both ends, and the **centre of the circle** is one such point, so the line must pass through it. A tangent point lies where the circle is touched from outside and has nothing to do with halving a chord. This is how you find a centre by drawing two chords.',
  'Angles in the same segment of a circle are':
    'Angles standing on the same arc, in the same segment, are **equal**, because each is half the angle the arc makes at the centre. Calling them supplementary would mean they add to 180, which is true only for opposite angles of a cyclic quadrilateral. Complementary, meaning they sum to 90, only fits an arc that is a quarter of the circle.',
  'Four points are concyclic when':
    'Concyclic means the four points all **lie on one and the same circle**, so each satisfies that circle\'s equation. Forming a square is only one example and is not required, since many rectangles and isosceles trapezia are concyclic too. Lying inside a circle is not enough, because the points must be on the curve, not within it.',
  'A circle has rotational symmetry of order':
    'A circle looks unchanged after a turn through any angle, and there are unlimited such angles, so its order of rotational symmetry is **infinite**. An order of 4 belongs to a square, which only matches at 90, 180, 270 and 360 degrees. An order of 1 would mean no turn smaller than a full circle works, which is true only for a shape with no symmetry.',
  'A square and a rectangle both have a perimeter of 24 cm. The square has side 6 cm and the rectangle measures 8 cm by 4 cm. Which one has the greater area?':
    'The square has area 6 × 6 = **36 cm^2** while the rectangle has 8 × 4 = 32 cm^2, so the square is larger. A common slip is thinking equal perimeters must mean equal areas, which is false. For a fixed perimeter the square is always the biggest rectangle, because making the shape thinner and longer shrinks its area.',
  'Use Heron\'s formula to find the area of a triangle whose sides are 13 cm, 14 cm and 15 cm.':
    's = (13 + 14 + 15)/2 = 21, so area = sqrt(21 × 8 × 7 × 6) = sqrt(7056) = **84 cm^2**. The 168 is double 84, which happens when the final result is doubled by mistake. The 42 is half of 84, a slip from halving the area as well as the perimeter.',
  'Using π = 22/7, what is the circumference of a circle of radius 7 cm?':
    'Circumference = 2 pi r = 2 × 22/7 × 7 = **44 cm**, because the two 7s cancel. The 154 cm is pi r^2 = 22/7 × 49, which is the area and is measured in square units. Getting 22 cm uses pi r only once, as if you had gone around only half the circle.',
  'A sector of a circle of radius 21 cm has a central angle of 60°. Find the area of the sector. (Use π = 22/7)':
    'The whole circle has area 22/7 × 21 × 21 = 1386 cm^2, and 60 degrees is 60/360 = 1/6 of a full turn, so the sector is 1386 ÷ 6 = **231 cm^2**. Answering 1386 forgets to take that fraction and gives the whole circle. Using only 21 × 60/360 without pi r^2 mixes this up with the arc length formula.',
  'Use Heron\'s formula to find the area of a triangle whose sides measure 10 cm, 10 cm and 12 cm.':
    's = (10 + 10 + 12)/2 = 16, so area = sqrt(16 × 6 × 6 × 4) = sqrt(2304) = **48 cm^2**. The 24 is half of 48, as if one more halving were needed. The 60 comes from 12 × 10 ÷ 2, which treats the side 10 as the height, but the real height on the 12 cm base is 8 cm.',
  'The ratio of the circumference of a circle to its diameter is':
    'Dividing the circumference 2 pi r by the diameter 2r cancels everything and leaves **pi**, about 3.14, for every circle. Answering 2 confuses the diameter with twice the radius. A ratio of 1/2 would claim the distance around is half the distance across, which no closed curve can do.',
  'The circumference of a circle of radius 7 cm is (take pi = 22/7)':
    'C = 2 pi r = 2 × 22/7 × 7 = **44 cm**, and the 7 cancels neatly. The 154 cm is the area pi r^2 = 22/7 × 49, in square centimetres. The 14 cm is just the diameter, and 22 cm uses pi r with the factor 2 missing.',
  'Heron\'s formula finds the area of a triangle from':
    'Heron\'s formula needs only the three sides, since s = (a + b + c)/2 and the area is sqrt(s(s - a)(s - b)(s - c)), so **no height is needed**. Base times height only works when a perpendicular height is known, which is often awkward to find. Angles alone do not fix a size, and a perimeter alone cannot pin down the shape.',
  'In Heron\'s formula, s stands for':
    's stands for the semi-perimeter, that is **half the perimeter**, so s = (a + b + c) ÷ 2. Every bracket in the formula subtracts a side from this value. Using the longest side instead would make s - a negative for that same side, and a negative number has no real square root.',
  'The area of a circle of radius 7 cm is (take pi = 22/7)':
    'Area = pi r^2 = 22/7 × 7 × 7 = 22 × 7 = **154 square cm**, and the unit is square centimetres because two lengths are multiplied. Returning 44 gives the circumference, the distance around the edge. The 49 is only r^2, before pi is applied.',
  'A sector of a circle is the region enclosed by':
    'A sector is the pizza-slice region bounded by two **radii** from the centre together with the arc between their endpoints, so one side is curved. A region cut off by a chord and an arc is a segment, which is a different shape. Two chords, or a diameter with a tangent, do not meet at the centre to form a slice.',
  'What is the perimeter of a square of side 6 cm?':
    'A square has four equal sides, so the perimeter is 4 × 6 = **24 cm**. The 36 is the area, 6 × 6, which measures the surface inside rather than the distance around. Answering 12 halves the number of sides, and 6 gives the length of only one side.',
  'Perimeter is measured in':
    'Perimeter is a distance travelled around a boundary, so it is measured in **units of length** such as cm or m. Square units belong to area, where two lengths are multiplied together. Cubic units suit volume, and degrees measure angles, so neither can describe a boundary length.',
  'What is the probability of an impossible event?':
    'An impossible event has no favourable outcome, so the probability is 0 divided by the total, which is **0**. Answering 1 describes a certain event, which is the exact opposite case. A probability can never be -1 or more than 1, because the favourable outcomes cannot exceed all the outcomes.',
  'Two fair coins are tossed together. How many outcomes are there in the sample space?':
    'Each coin has 2 faces, so the pairs are HH, HT, TH and TT, giving 2 × 2 = **4** outcomes. Answering 3 happens when HT and TH are treated as the same result, but the two coins are separate, so order counts. The 8 belongs to three coins, since 2 × 2 × 2 = 8.',
  'A fair die is rolled once. What is the theoretical probability of getting a prime number?':
    'The primes on a die are 2, 3 and 5, so 3 favourable outcomes out of 6 give 3/6 = **1/2**. The 1/6 counts only one prime, such as 2, and forgets the others. The 2/3 usually comes from counting 1 as prime, which gives 4/6, but 1 has only one factor and is not prime.',
  'A fair coin is tossed and then a fair die is rolled. Using a tree diagram, find the total number of outcomes and the probability of getting a head followed by a 6.':
    'The tree has 2 coin branches and 6 die branches, so there are 2 × 6 = **12** outcomes, and head then 6 is only one path, giving **1/12**. The 1/6 answer forgets the coin, and 1/2 forgets the die. Multiplying the counts is the quick way of reading every path of the tree.',
  'Probability of an impossible event is':
    'With no outcome that can make the event happen, the fraction favourable over total is 0, so the probability is **0**. Answering 1 would say the event is certain, which contradicts the word impossible. A value such as -1 is outside the allowed range, because a probability must lie between 0 and 1.',
  'Probability of a certain event is':
    'If an event must happen, every outcome in the sample space is favourable, so favourable over total is 1 and the probability is **1**. Answering 0 confuses certainty with impossibility. Writing 100 confuses the probability with its percentage form, since 1 is the same as 100 percent.',
  'Theoretical probability of a coin landing on heads is':
    'A fair coin has one head among two equally likely faces, so the theoretical probability is **1/2**, that is 0.5. Answering 1 would claim heads appear every time, which is only true for a two-headed coin. The value 2 is impossible, because no probability can be greater than 1.',
  'Experimental probability is found by':
    'Experimental probability comes from actually performing the trial, **counting** how often the event happened, and dividing by the number of trials. Guessing gives no evidence at all. Multiplying by 100 only converts a finished probability into a percentage, so it is a later step, not the method.',
  'When a die is rolled once, how many outcomes are in the sample space?':
    'One roll shows exactly one face from 1 to 6, so the sample space has **6** outcomes. The 12 usually comes from doubling as if two dice were rolled, but here there is only one. Answering 1 or 2 counts the dice or the coins rather than the faces on the die.',
  'What is an event in probability?':
    'An event is a chosen collection of outcomes, for example getting an even number means {2, 4, 6}, so it is a **set of outcomes we are interested in**. A number between 0 and 1 is a probability, which measures the size of that set out of the whole. The total number of trials is how often the experiment ran, not what we are watching for.',
  'A tree diagram is used to':
    'A tree diagram branches once for each event and lists **all possible outcomes**, so the ends of the branches give the whole sample space. You can then count the favourable paths to get a probability. Measuring an angle or finding the area of a circle belongs to geometry and needs no branches at all.',
  'Tossing two coins gives how many equally likely outcomes?':
    'Tossing two coins gives HH, HT, TH and TT, so there are **4** equally likely outcomes because 2 × 2 = 4. Saying 3 merges HT with TH, but those are different results once you track which coin shows the head. The 8 appears when three coins are tossed, since 2 × 2 × 2 = 8.',
  'What is the next term of the sequence 2, 6, 18, 54, ...?':
    'Each term is 3 times the one before: 2 × 3 = 6, 6 × 3 = 18, 54 × 3 = **162**. The 108 doubles the previous term instead of tripling it, which breaks the constant ratio of 3. The 216 doubles 108, so it uses the wrong multiplier and skips the real one.',
  'Which term of the arithmetic progression 5, 9, 13, 17, ... is equal to 65?':
    'With a = 5 and d = 4, the rule a + (n - 1)d = 65 gives 4(n - 1) = 60, so n - 1 = 15 and n = **16**. Answering 15 stops after dividing and forgets to add 1 back, which is the usual slip with this formula. The 17 would need one extra term.',
  'The third term of a geometric progression is 12 and the fifth term is 48. If the common ratio is positive, find the common ratio and the first term.':
    'Dividing the fifth term by the third gives r^2 = 48 ÷ 12 = 4, so r = **2** because the ratio is stated positive, and the first term is 12 ÷ 2^2 = **3**. Answering r = 4 forgets to take the square root of 4. Taking r = -2 also squares to 4, but the positive condition rules it out.',
  'The nth term of a sequence is given by t(n) = 3n − 2. What is the 10th term?':
    'Substitute n = 10 into the rule: 3 × 10 - 2 = 30 - 2 = **28**. The 32 adds 2 at the end instead of subtracting it, which flips the sign. The 25 uses n = 9, which gives the previous term rather than the tenth.',
  'What is a sequence?':
    'A sequence is an **ordered list of numbers that follows a rule**, so 2, 4, 6, 8 differs from 8, 6, 4, 2 even though the same numbers appear. Any random group of numbers is not a sequence because there is no pattern to continue. A single number or a fraction has no positions to order, so neither can be a sequence.',
  'What is the next term of 3, 7, 11, 15, ...?':
    'The gap is always 4, since 7 - 3 = 4 and 11 - 7 = 4, so the next term is 15 + 4 = **19**. The 18 assumes a gap of 3, which the earlier terms do not support. The 23 adds 8, that is two steps at once, and skips a term.',
  'A recursive rule describes a term using':
    'A recursive rule builds each term from **the previous term**, like t(n) = t(n - 1) + 3, so you work through the terms in order. A rule written in terms of n is the explicit form, which can jump straight to any term. A random value cannot produce a predictable sequence, so it cannot be a rule at all.',
  'An explicit rule gives a term using':
    'An explicit rule uses **its position number n** directly, so t(50) can be found in one step without listing the earlier terms. A rule using the previous two terms is recursive and needs those values first. The sum of all earlier terms is a running total, not a single term of the sequence.',
  'In an AP, the difference between consecutive terms is':
    'In an arithmetic progression the gap between consecutive terms is the same every time, so that difference is **constant**. Doubling each time describes a geometric progression instead. A random difference would destroy the pattern, and a difference of zero is only the special case where every term equals the first.',
  'The 10th term of the AP 2, 5, 8, ... is':
    'Here a = 2 and d = 3, so the 10th term is a + 9d = 2 + 9 × 3 = 2 + 27 = **29**. The 26 uses 8 gaps instead of 9, so it lands on the ninth term. The 32 uses 10 gaps, adding one step too many.',
  'In a geometric progression each term is found by':
    'In a geometric progression each term is the previous term **multiplied by a fixed number** r, so 3, 6, 12, 24 doubles each time. Adding a fixed number gives an arithmetic progression, not a geometric one. Squaring the previous term grows far too fast to be a fixed ratio, and subtracting a fixed number just steps evenly downwards.',
  'What is the next term of 2, 6, 18, 54, ...?':
    'The ratio is 3 because 6 ÷ 2 = 3 and 18 ÷ 6 = 3, so the next term is 54 × 3 = **162**. The 108 adds 54 to itself, which changes the multiplier to about 2 and breaks the pattern. The 72 halves the term instead of multiplying, and 90 adds 36, so neither continues the rule.',
  'Why did Krishtakka decide that she must learn the Kannada alphabet?':
    'While the narrator was at a wedding, the new episode of **Kashi Yatre** arrived and Krishtakka could not read one line of it, so she sat silent while the family discussed the story. That helplessness, not any wish to write a novel, is what made her ask for lessons. No friend ever laughed at her in the temple courtyard.',
  'In ‘Bharat Our Land’, which of these does the poet say has ‘no equal anywhere on earth’?':
    'The poem gives the claim "no equal anywhere on earth" to the **Himavant**, the Himalayan range, which stands as the country\'s crown. The Ganga is praised as generous and the Upanishads as sacred, but neither is called unequalled. Choosing the river confuses two separate praises in the same passage.',
  'In ‘Bharat Our Land’, the Ganga is praised chiefly as a symbol of —':
    'The Ganga is honoured for its **purity** and its **generosity**, water that cleanses as it flows and gives life to the plains it crosses. Courage and wisdom belong to other images in the poem, while strength and permanence are what the mountains suggest. The river is praised for what it gives, not for what it endures.',
  'At the end of the story, the sixty-two-year-old grandmother bends down and touches her twelve-year-old granddaughter’s feet. Why does she do this, and what does it show about her idea of learning?':
    'She bends to the feet not of a granddaughter but of a **teacher**, saying a teacher must be respected "irrespective of the gender and age". The gesture shows that learning outranks age and family rank, so an elder can become a pupil and keep her dignity. Reading it as mere obedience to a child misses the point, which is honour for knowledge itself.',
  'Why did learning to read matter so much to the grandmother?':
    'Reading gave Krishtakka **independence**: she could open Kashi Yatre herself instead of waiting for someone to read it aloud, and that self-respect changed how she carried herself. The story never mentions money, school rules or travel, so those options describe a different kind of learner. For her the prize was dignity, not usefulness.',
  'What did the grandmother ask for as her first reading lesson?':
    'Her first request was the **Kashi Yatre** story itself, the serial she had followed for years and could not read once the narrator was away. A letter, a book of poems or a newspaper would all have been easier texts, but she wanted the one that had shut her out. Learning with a story she loved kept her going.',
  'What does the story show about learning?':
    'Krishtakka starts the **Kannada alphabet** at sixty-two and is reading a novel confidently within months, which is the whole argument of the story. Her age is the obstacle she defeats, so the idea that old people forget quickly is contradicted by her ending. No school building or classroom appears anywhere in the account.',
  'How did the grandmother practise reading?':
    'She studied at **night**, after the household had gone to bed, and repeated the letters until she knew them by heart, which is why the narrator finds her bent over a book in the dark. Nobody read the pages for her and no radio is mentioned. The progress came from her own daily repetition.',
  'In the poem \'Bharat Our Land\', what is the land compared to?':
    'The poem addresses the country as **Bharat Mata**, a mother whose children we are, and her rivers and mountains become her limbs. The river, the mountain and the garden appear as details inside that picture, not as the central comparison. The mother image is what lets geography be loved like a person.',
  'What does the poem say the people of Bharat share?':
    'What the people share is **one land and one heritage**, a single civilisation to which many regions and languages belong. The poem never claims one language, one religion or one festival, since that would deny the variety it is celebrating. Shared belonging, not sameness, is its claim.',
  'Which image best shows patriotism in the poem?':
    'Calling the **rivers and mountains** the mother\'s limbs turns geography into a body the reader can love, and that is how the poem makes patriotism felt rather than argued. A market, a classroom and a train are ordinary scenes that carry no devotion to the land. The image works because it is intimate, not grand.',
  'What is imagery in a patriotic poem meant to do?':
    '**Imagery** works on the feelings: a mountain described as part of the mother makes a reader feel love and pride rather than learn a fact. Facts about government belong to prose, and grammar rules have nothing to do with pictures in a poem. The picture is there to move you, not to inform you.',
  'Why did Arenla want Sentila to become a weaver rather than a pot maker?':
    'Arenla knew that pottery meant standing at the wheel through sun and rain for a small return, while **weaving** could be done indoors in any season and paid better for less trouble. She was thinking of her daughter\'s comfort, not obeying any council order. The clay bank was not exhausted, and Sentila was drawn to pots from childhood.',
  'After Sentila made a pot under Onula’s guidance, what did Onula say was still wrong with it?':
    'Onula turned the finished pot in her hands and said the **mouth** was all wrong, so the shape would neither hold nor pour as it should. The clay itself had been pounded and wedged properly, which puts the fault in the last shaping rather than the preparation. A thin base or skipped drying is invented here.',
  'In ‘Gifts of Grace: Honouring Our Vocations’, what does the line ‘The voice of their vocation is the voice of their identity’ mean?':
    'The line says a person\'s **vocation** speaks for them: the carpenter, boatman and shoemaker are known by the work they do, not by what they are paid for it. The poem does not claim every worker sings, and a vocation is chosen by the worker rather than assigned by the community. Taking "voice" literally as singing loses the metaphor.',
  'The poem begins and ends with the same line, ‘I hear Bharat celebrating, the varied vocations I hear!’ Why does the poet repeat it?':
    'Repeating **"I hear Bharat celebrating, the varied vocations I hear!"** at the opening and the close frames the poem as one unbroken celebration, so the country is heard as a chorus of trades rather than a single voice. The last line gathers carpenters, boatmen and masons into one shared act. Calling it padding ignores how neatly the circle closes.',
  'What makes a pot maker\'s work craftsmanship?':
    '**Craftsmanship** here means the skill, patience and care that go into shaping each pot until its mouth and curve are true. Machines, speed and sales figures measure output rather than craft, and the chapter is careful to keep the two apart. A pot made fast but crooked is still a bad pot.',
  'What is a vocation?':
    'A **vocation** is work a person feels called to, the trade that shapes identity and not only income. A holiday, a tool and a shop are things that sit around work, and none of them is the calling itself. The word carries a sense of purpose, which is why it fits the potter at the wheel.',
  'What does \'honouring a vocation\' mean in the chapter?':
    'Honouring a **vocation** means treating the work with respect and doing it as well as one can, the way Onula does at the wheel. Changing jobs constantly, avoiding effort or chasing only the highest income would all be the opposite of honour. Honour shows in the care taken, not in the size of the wage.',
  'Why are crafts like pottery called gifts of grace?':
    'Crafts are called **gifts of grace** because they are handed down through families and practised with devotion, so the skill arrives as an inheritance rather than a purchase. Nothing about them is free and nothing about them is easy, since years of practice sit behind every pot. The phrase expresses gratitude, not price.',
  'What does \'dignity of labour\' mean?':
    '**Dignity of labour** means that every honest job, at the wheel or in the field, carries its own worth and deserves respect. The idea that only office work is respectable is exactly what the chapter sets out to challenge. Work is judged by how it is done, not by how much it pays.',
  'How does the chapter show respect for the pot maker\'s work?':
    'Respect is shown by **describing** the work closely: the kneading of the clay, the turning of the mouth, the meaning a pot carries in a home. Calling the work easy or likening the potter to a machine would belittle it, and ignoring the workshop would leave nothing to admire. Attention is the form respect takes here.',
  'How does a pot maker build skill over time?':
    'Skill grows through **repeated practice** at the wheel, where the hands learn a pressure that no explanation can pass on. Better clay alone cannot shape a mouth, watching once cannot train the fingers, and working only on festivals leaves the clay cold. The body has to learn the craft by doing it again and again.',
  'What happens to a pot that is not shaped carefully?':
    'Clay records every careless press, so a badly shaped pot **collapses** on the wheel or dries lopsided and will not sit level. Firing cannot repair a weak shape, it only fixes the fault permanently. Nothing turns into glass and nothing escapes the fire.',
  'Where does the text find evidence of the pankhi, the small plumed fan, being used in ancient India?':
    'The oldest evidence the text cites is in the **Buddhist wall paintings at Ajanta**, where a small plumed fan appears beside attendants in panels of the 2nd century CE. Mughal miniatures are some fourteen centuries later, so they cannot be the earliest proof. The brass engravings and palm-leaf manuscripts belong to other crafts entirely.',
  'Which step does the text suggest as one of the first to preserve the craft of the pankha?':
    'The first step suggested is to **celebrate pankhas**, to look at them and tell the stories and skill they carry, because a craft nobody values dies before anyone can ban or buy it. Stopping exports, swapping them for machines and locking them in museums would all take the fan out of daily life instead of reviving it. Admiration keeps a craft alive.',
  'In ‘Canvas of Soil’, the phrase ‘Brushstrokes of seeds, planted true’ suggests that —':
    'The metaphor makes the **sower** the painter: a seed dropped in a straight line is the gardener\'s first stroke on the soil. No seed is literally painted, and the gardener is not copying a finished picture. The likeness runs from garden to painting, not from painting to garden.',
  'The last line of ‘Canvas of Soil’ says, ‘Gardens become paintings still.’ What does the word ‘still’ add to the comparison between a garden and a painting?':
    '**"Still"** carries two meanings at once: the garden is still (even now) a painting, endlessly repainted by growth and season, and it is also a still life, the painting of quiet objects such as flowers and fruit. Reading it only as "motionless" loses the pun on the still-life form. The garden is both a living picture and a painted one.',
  'What is a pankha?':
    'A **pankha** is a hand fan, held and waved to move air, often a plumed or palm-leaf object rather than a machine. A lamp, a pot and a mat are other household things, but none of them is held to make a breeze. The name belongs to the thing that cools you by movement.',
  'Which materials are traditionally used to make a pankha?':
    'Pankhas are plaited and stitched from **bamboo, palm leaves and cloth**, materials a village can gather and work by hand. Steel, glass, plastic and cement belong to factory production, which is precisely what the hand fan is being compared against. The materials are part of what makes it a craft.',
  'What does \'winds of change\' suggest in the chapter?':
    'The title means that **change** is already blowing through the country, and a craft survives only by bending with it, as the fan takes new designs and new uses. It is not a remark about the weather, and it certainly does not argue that old crafts should be forgotten. The wind is a warning and an invitation at once.',
  'How can a traditional craft survive today?':
    'A craft survives by finding **new designs and new uses**, such as a pankha sold as decoration or as a gift, so it reaches buyers a plain fan no longer reaches. Refusing to change or halting production freezes it, and copying machines abandons the very skill worth saving. Adaptation keeps the hand in the work.',
  'What does \'canvas of soil\' refer to?':
    'The **canvas of soil** is the ground itself, treated as a painter treats cloth: a surface prepared, marked and coloured with plants. A pot, a crop field and a mud wall are all made of earth, but none of them is being used as a picture surface. The comparison depends on the soil being looked at, not used up.',
  'Which sense does the phrase \'canvas of soil\' mainly appeal to?':
    'The phrase appeals mainly to **sight**, because a canvas is something you look at and the image asks you to see the bed as a painted surface of colour and shape. Soil has a smell and a texture as well, but the canvas comparison is purely visual. The poem is making you look, not smell or listen.',
  'Why is gardening described as an art?':
    'Gardening is called an art because it needs **design, patience and a sense of beauty**: choosing what grows where and waiting for the planting to compose itself. Water and vegetables are only its materials and its results, and a useful garden can still be badly arranged. Art lies in the arrangement, not the produce.',
  'What does a gardener do that a painter also does?':
    'Both **arrange colours and shapes** deliberately, the painter with pigment and the gardener with leaf, flower and stone. The gardener uses no brush and sells no pictures, so the likeness lies in the planning rather than the tools. Two different crafts can share one way of seeing.',
  'Why had Ravi’s grandfather come to live with Ravi’s family?':
    'Grandpa had slipped in his own **garden** and lain there all night because nobody was at home to hear him, and that fright is what made the family bring him to the city. Illness, rent and getting lost are not the cause. The accident mattered because living alone had made it dangerous.',
  'Why did Grandpa resent his daughter’s instruction that he should not go out on his own?':
    'He had run his own house, money and garden for **seventy-five years**, so a rule made for his safety felt like being demoted to a child or locked in. His old friends, the safety of the streets and the newspaper shop are details he mentions, not the real wound. The quarrel is about dignity, not geography.',
  'Which sense does the second stanza of ‘I Cannot Remember My Mother’ chiefly rely on?':
    'The second stanza is built on **smell**: the shiuli flowers and the scent that drifted from the morning temple service. The blue of the distant sky belongs to a later stanza and the hummed tune to the first, so those senses are placed in the wrong part of the poem. Each stanza remembers her through a different sense.',
  '‘I Cannot Remember My Mother’ repeats the line ‘I cannot remember my mother’, yet almost every line of the poem is about her. How do you explain this seeming contradiction?':
    'What is missing is her **face** and her everyday presence; what survives is a set of sensory traces, a tune over his playthings, the shiuli scent, her stillness filling the sky. The refrain measures the loss rather than denying the memory, so absence and presence share one line. Calling it forgetfulness ignores how much of her the poem keeps.',
  'What does the \'M\' in Vitamin-M stand for?':
    'The title is a joke with a serious point: **Vitamin-M** is no tablet or mineral but the "medicine" of love and company that lonely elders actually lack. Morning exercise keeps the body well, yet the story shows Grandpa fading for want of conversation rather than for want of movement. What he is short of cannot be bought at a chemist.',
  'What do old people need most from their families?':
    'Grandpa craves **time, attention and respect**, someone to sit with him and ask what he thinks. Gifts and clothes are things a family can send without staying, and silence is what made his loneliness worse rather than a cure. Company is the one thing that cannot be delivered by a courier.',
  'Why is independence important for an elderly person?':
    'Being able to decide small things, when to walk and what to buy, keeps **self-respect** alive, because being managed tells a person that their judgement no longer counts. This is not about saving the family money, and nobody claims elders need no help at all. The point is that help should support choice, not replace it.',
  'How can young people support an elder\'s independence?':
    'Support means **asking before deciding** and helping where help is actually wanted, so the elder stays in charge of his own life. Taking over every task or ignoring his wishes is control dressed up as care, and moving him to a home removes the independence altogether. Small permissions restore more than large gifts.',
  'In the poem, how does the child remember the mother?':
    'The child remembers her through **tunes, smells and sounds**: a tune hummed over his toys, the fragrance of shiuli flowers, the quiet of a temple morning. There are no photographs, letters or phone calls in the poem, because the point is that the senses keep what pictures cannot. The mother arrives through the body, not an album.',
  'Who is the speaker of the poem?':
    'The speaker is a **child** who has lost his mother and is piecing her together from sense impressions, which is why the images are so small and domestic. A mother remembering a child would reverse the poem, and no teacher or gardener appears anywhere in it. The short lines sound like someone thinking quietly.',
  'What is sensory memory in the poem?':
    '**Sensory memory** is a memory that arrives through a smell, a sound or a touch before it arrives as a fact, the way a fragrance can bring a whole person back. A list learnt by heart, a photograph in a drawer and a friend\'s story are records rather than sensations. The poem trusts the senses more than the mind.',
  'What feeling does the poem create through absence?':
    'The poem creates **quiet grief mixed with tenderness**: the loss is real, yet nothing in it is bitter and the mother comes back as gentleness rather than as a wound. There is no anger at her, no celebration and no fear, and the tone stays soft throughout. Sadness and love are held in the same breath.',
  'In which event did Dr Deepa Malik win the silver medal at the 2016 Rio Paralympic Games?':
    'Her own account is that the breakthrough came at the 2016 Rio Games, when she \'secured the silver medal in the shot-put event\'. **Shot-put** was the event, though swimming is the sport she had loved and India\'s first Paralympic medal in 1972 also came in swimming, which is the mix-up the other choices rely on.',
  'In ‘Nine Gold Medals’, what did the eight other runners do when the smallest athlete stumbled and fell?':
    'Stanza 6 shows the eight runners \'pulled up on their heels\', which means they stopped, and then \'one by one\' turned back to help. **Pulled up** is the clue that they gave up the race; waiting at the finish line would have left the boy still lying \'on the asphalt\', and the poem never shows them running on.',
  'A banner above the field said ‘Special Olympics’. Why does the poet say it ‘could not have been more on the mark’?':
    'The banner fits because the **Special Olympics** exists to promote inclusion, and the runners turned rivals into helpers, which is that idea in action. The nine medals are a result of the kindness, not the reason the banner was apt, since medals alone are not what the Special Olympics stands for.',
  'Dr Malik says her goal is a society where everyone, ‘regardless of ability, is treated with dignity and given a fair chance to succeed’. How is this different from feeling sorry for persons with disabilities?':
    'Pity looks down on a person and treats disability as a loss to be mourned; **dignity** treats that person as an equal, whose ability is real and whose chance is a right. That is why she asks for accessible sport, equipment and fair chances rather than sympathy, and calls disability \'a unique strength waiting to be unleashed\'.',
  'What do the Paralympics show the world?':
    'The text says the Games \'go beyond competition, to quell stereotypes and redefine possibilities\', and seeing \'the strength, skill, and competitive spirit\' of para-athletes breaks down preconceived notions. So they show **determination** beating the limits others assume; the idea that only able-bodied athletes matter is the stereotype they quell.',
  'What is resilience?':
    'The glossary defines **resilience** as the ability to recover quickly from difficult circumstances, and Dr Malik links it to the mental strength that helped her face being underestimated. It is a bounce-back quality rather than speed or a medal, and it is the opposite of avoiding a problem, because she \'embraced challenges\' instead.',
  'What is the difference between empathy and sympathy?':
    'The textbook sorts the words this way: **empathy** says \'I can imagine how you feel\', while sympathy says \'I am so sorry for what is happening to you\'. Empathy shares the feeling and sympathy offers it from outside, so calling them the same thing loses the point, and sympathy is not the stronger of the two.',
  'Which action best shows compassion?':
    'Compassion turns feeling into action, like the textbook\'s example of staying with someone so that they \'don\'t feel lonely\'. **Helping without being asked** is that action, while saying sorry and walking away stops at sympathy and telling a person to try harder blames them instead of sharing the weight.',
  'In the poem \'Nine Gold Medals\', why do the runners stop?':
    'Stanza 4 explains it: the runners charge ahead, but \'the smallest among them, he stumbled and staggered / And fell to the asphalt\'. The stopping is caused by **one fall**, not by weather or by the crowd, and the poem mentions none of the rain or tiredness that the other choices invent.',
  'Why does every runner receive a gold medal in the poem?':
    'All nine get **gold medals** because they came to the finish line \'holding hands still\', after giving up a race they had trained months for. The clock is not the reason, since they had just walked the dash together; the poem treats the medals as an honour for the kindness rather than a timing coincidence.',
  'What does solidarity mean?':
    '**Solidarity** is the fellow feeling that makes people act as one, and the poem shows it when the nine \'joined hands\' and finished together. Winning at any cost and working alone are its opposites, because solidarity costs you something for another person\'s sake, just as the eight runners gave up their own race.',
  'What is the poem\'s message about competition?':
    'The eight runners \'had trained for so long to compete\' and then threw that chance away to lift a stranger, so the poem ranks **kindness** above coming first. It never says losing is shameful or that races should end; it says the standing ovation and \'nine beaming faces\' spoke for themselves.',
  'Why had Shruti not told her father about the fusion rehearsals?':
    'Shruti spells out her fear: Nabin \'will think it a desecration of the violin to be played to Western tunes\', since he believes Hindustani classical music is the only music worth playing. Her silence is **fear of his disapproval**, not a plan to surprise him, because she keeps promising to \'bring this up\' at dinner and dreads the moment.',
  'After hearing the group rehearse, what did Nabin praise most in Shruti’s playing?':
    'Nabin\'s praise is precise: she \'did not lose sight of the notes of the raga even once\'. **Keeping the raga** inside a fusion piece is what convinces him, so he is not praising speed or a solo, and he never wanted her to abandon Western music, since the point is that the classical notes survived the experiment.',
  'In the first stanza of ‘A Friend Found in Music’, how does the poet describe music?':
    'The poem opens with \'Music is the ocean / That pulls me to the shore\', so the **ocean** is its first picture of being drawn in. The rhythm line follows inside the same stanza, while the friend and the therapy images appear in the closing stanzas.',
  '‘Music is the therapy / I need when I feel blue. / Music lifts my spirits / To make sure I pull through.’ What does ‘pull through’ add to ‘lifts my spirits’?':
    '\'Lifts my spirits\' names the change of mood; **\'pull through\'** adds that the lift is what carries her past the hard time itself, so music gets her to the other side of sadness instead of only cheering her for a moment. That is why the poem can call it a therapy and then \'the needed friend / When no one seems to care\'.',
  'What happens when tradition meets innovation in the chapter?':
    'In this play both survive: Shruti plays fusion but never loses \'the notes of the raga\', and Nabin ends by saying \'each bay, its own wind\'. So **tradition is kept alive with new ideas**, and the father\'s early fear that fusion would destroy the tradition turns out, in his own words, to be \'baseless\'.',
  'Why is the chapter titled \'Twin Melodies\'?':
    'The title names the two traditions on one stage: **Hindustani classical**, with its ragas and aalaaps, and Indo-Western fusion, with tabla, flute, violin and keyboard together. The \'twin\' idea also covers the two generations, father and daughter, whose melodies finally agree; no twins or broken instruments appear in the play.',
  'What is classical music known for?':
    'Classical music here means **ragas and aalaaps**, a fixed and highly structured system that Nabin says must be studied slowly, since his rule is one performance in six months so that \'familiarity breeds contempt\'. It is not short beats or electronic sound, and it is not voiceless either, as his own family were trained vocalists.',
  'How does contemporary music differ from classical music?':
    'The fusion group adds a **keyboard** and mixes Western tunes with Indian ragas, and that mixing is what makes it contemporary. It does not mean less work, because the group rehearses every day and keeps rhythm and tune, so \'no practice\' and \'no rhythm\' get the idea backwards.',
  'How can music act as a friend?':
    'The poem\'s last lines call music \'the needed friend / When no one seems to care\', so the friendship is the **comfort** it gives in loneliness and sadness. Music never speaks in words, which is why it is a friend of feeling rather than conversation, and it does not do homework or earn money.',
  'What does the chapter say about learning music?':
    'Nabin\'s own life is the proof, since he \'worked his fingers to the bone\', and he tells Shruti to \'work on your art and everything will follow\'. So **years of patient practice** are needed, and because he is the principal of a music school who teaches her, the claim that music needs no teacher is the opposite of what happens.',
  'What does \'consolation\' mean?':
    '**Consolation** is the comfort you give someone who is sad, and the poem uses music that way when it is \'the therapy I need when I feel blue\'. A prize, a note or applause may be part of music, but none of them is comfort offered to a person in pain.',
  'Which line best shows music as consolation?':
    '\'When I was sad, the raga held me like a hand\' turns music into a **hand** that holds you, and that is comfort given to someone low. The full hall, the tuned tabla and the red shawl only describe a concert setting, so they show a performance rather than consolation.',
  'What does Khetaram do with a letter whose right corner has been torn off?':
    'That torn corner \'signifies that the missive bears news of death\', and Khetaram says \'Ashubh Samachar cannot be carried into the house\'. So he reads it **outside, twice**, and then tears it up, because \'bad news must be destroyed\'; he does not carry it inside, send it back or hand it to an elder.',
  'According to the text, how heavy is a Gramin Dak Sewak’s mailbag allowed to be?':
    'The text states the rule plainly: \'Regulations stipulate that his load cannot exceed **28 kilos**.\' The figure matters because the imprint of his footprints shows the weight he really carries; 50 is not a weight limit at all, it is the temperature at which a state holiday must be declared.',
  'In Charles Swain’s poem ‘Words’, why are words compared to ‘summer birds’?':
    'The line is \'But words, like summer birds, depart, / And leave but **empty air**\', so the comparison is about words flying off and leaving nothing behind. They are not sweet singers, they do not return each year, and they build no nests; the point is how quickly careless words vanish.',
  'Explain the contrast the poet draws between ‘hosts of words’ and ‘a little said, and truly said’.':
    'A host of words may \'reach the head\' but never \'touch the heart\', while **\'a little said, and truly said\'** can \'deeper joy impart\'. The poem judges words by truth and feeling rather than number, which is why the voice that cheers \'a lonely home\' may have \'the fewest words to say\' and still be the dearest.',
  'What does \'few words, how dear\' suggest?':
    'The last stanza ends \'Hath oft the fewest words to say; / But, oh! those few, how dear!\' So **few words** are precious because a short, sincere message can carry deep feeling. Long letters are not praised here, and words are certainly not worthless, since the poem spends four stanzas showing their power.',
  'Why are written words precious to a family far away?':
    'A letter crosses miles that a family cannot, carrying **news and love** such as births, weddings, money orders and condolences, which is why the post is the \'sole link\' for remote hamlets. Good paper, easy writing and official signatures describe the form of a letter, not the reason it matters to a mother or a son.',
  'What does the postman represent in the chapter?':
    'Khetaram is \'a trusted link\' who walks 20 km a day \'defying all elements\', and people like him are called \'a part and parcel of our social fabric\'. So the postman stands for **trust and service**; speed and profit, power and authority, wealth and comfort are exactly what his job does not give him.',
  'Why is the postman trusted by the villagers?':
    '**Fifteen years** of delivery through sandstorms, 50-degree heat and border country made him \'a warmly received man\', and the villagers defend him when a scheme to replace him is proposed. He does read letters aloud, but that is a service they ask for because they trust him, not the cause of the trust.',
  'What power do words have, according to the chapter?':
    'The chapter shows words doing all three: news of a birth brings jaggery and joy, death news has to be handled with care, and money orders hold families together. So **comfort, union and healing** are their power, and saying that words only give information ignores the poem\'s claim that a few of them can \'deeper joy impart\'.',
  'Which word best describes a letter that brings good news?':
    '**Welcome** is the word we pair with good news, since \'welcome news\' means news we are glad to receive. Heavy and empty describe the torn-corner letter of death, and silent describes no letter at all, so none of them fits a happy message.',
  'What is a Gramin Dak Sewak?':
    'A **Gramin Dak Sewak** is the village postal worker, the name India\'s rural \'delivery agents\' have carried since 2001, and they make up more than half of the postal workforce. Khetaram is one, carrying the mailbag on foot where no road or railway reaches.',
  'Why is the Gramin Dak Sewak important in rural India?':
    'He is the \'sole link between the oases of humanity in India\'s extremes and their faraway families\', delivering mail within 24 hours of dispatch and bringing money orders that families live on. That makes him a **connector** of remote villages, not a teacher, a road mender or a stamp seller.',
  'According to the letter of 19 June 1995, how long must a person pursue a subject to reach world-class standard in any field?':
    'The letter says that \'to reach world-class standard in any field, one has to be singularly and intensively pursuing the subject for **at least ten years**\'. The mother even measures her own book by that span: \'publishing this book is a dream I have chased in the last ten years\'. Money does not set the measure she gives.',
  'What does the mother mean when she tells Ming to ‘Count the cost in years of effort, financial investments and sacrifice’?':
    'She asks Ming to weigh the price honestly, and only then to \'plunge\' if it is \'still burning in your blood\', so the counting comes **before** commitment rather than instead of it. She never tells her daughter to quit when a dream looks costly, and she is not talking about salary or about only rich families being allowed to dream.',
  'In ‘Believe in Yourself’, why is ‘the first step’ called the hardest?':
    'The poem gives the reason in stanza 3: \'There is such ease in comfort / To maintain the status quo, / But this isn\'t what we are made for\'. So the first step is hard because it means **leaving comfort behind**; the line about the crowd explains that nobody is watching, not why the step is difficult.',
  '‘Believe in Yourself’ opens with the line ‘There is no crowd to see’. What does the absence of a crowd suggest about believing in yourself?':
    'It means the choice is made without witnesses or applause, since \'It\'s just you and the future / And where you want to be\', so **self-belief** has to be its own witness. The step is taken between the person and the future rather than in front of an audience, which is why the poem speaks to \'you\' directly and ends on believing in yourself.',
  'What does the mother\'s letter advise in \'Follow That Dream\'?':
    'The letter\'s first line sets the tone: \'By all means follow that dream\', and she adds that great people \'pursue it till it comes true\'. So the advice is **perseverance**, though an honest kind, because she also asks Ming to count the cost first; she never suggests the easiest path or copying a friend\'s dream.',
  'Why does a letter from a parent help a young person?':
    'A parent\'s letter gives **encouragement** and the feeling that someone stands behind you, which the letter itself shows when it describes a winner thanking \'a host of people that formed his/her support network\'. It is not about fees, rules or orders to come home, but about being believed in.',
  'What is the first step towards a dream, according to the chapter?':
    'The poem\'s last stanza says \'You just need to believe in yourself / For your future to be on track\', so the first step is **self-belief**. Announcing the dream, waiting for the right moment and borrowing money are all things a person can do without ever starting, which is why the poem puts belief first.',
  'What usually stands between a person and their dream?':
    'The poem asks \'Will it pull you forward / Or push you back in **fear**?\', naming fear as the force that stops a person at the edge of change. The letter adds the other half, since many people \'have never got beyond just wishful thinking\', so it is fear plus inaction rather than talent or friends.',
  'What does self-belief help a person do?':
    '**Self-belief** is what lets a person act with \'no crowd to see\', try something difficult and get up again when it goes wrong, because the future is still theirs to shape. It does not promise a life without mistakes or success without effort, and it is not a reason to ignore advice.',
  'Which sentence best expresses self-belief?':
    '\'I may fail today, but I will try again tomorrow\' accepts failure and still chooses to continue, which is **self-belief** in action. The other sentences give up before starting or hand all the power to other people, and that is the opposite of the poem\'s closing call to believe in yourself.',
  'Why is the first step the hardest?':
    'The first step takes the most **courage**, because it is made with \'no crowd to see\' and no proof that it will work, and it demands the biggest change, leaving \'the status quo\'. Its difficulty is not about length, money or planning; the poem says that once it is taken there is \'no turning back\'.',
  'What helps a person take the first step towards a goal?':
    'A large goal feels impossible until it is cut into **small, clear actions**, and each finished one is proof that the next can be done. Waiting for perfect conditions keeps you in the comfort zone the poem warns against, and comparing yourself with others only adds the fear that belief is meant to answer.',
  'In the puri investigation, which of these is something you can measure?':
    'A stopwatch gives you a number with a unit for the **time taken by the puri to puff up**, so two trials can be compared fairly. The colour of the flour is something you judge by eye, and the brand of oil is only a label, not a quantity. Something you can measure must give a number you can record and repeat.',
  'Why should you change only one thing at a time while doing an experiment?':
    'A fair test keeps every other condition the same, so a difference in the result can only come from **the one thing you changed**. Change the flame and the amount of dough together and you cannot tell which one made the puri puff faster. Believing that changing many things at once gives a quicker answer is what spoils the test.',
  'Which is the best record to keep while investigating?':
    'A **written note of what you changed, what you observed and what you measured** lets another student repeat your test and check the claim. Recording only the final result throws away the conditions, so nobody can explain why it happened. A guess written down is still a guess, not evidence.',
  'In a fair test, how many variables should you change at a time?':
    'Exactly **one** variable is changed in each trial, while every other condition is held the same. That way any difference in the result can be traced back to that single change. Changing two or three together mixes their effects and leaves you guessing which one mattered.',
  'The variable you deliberately change is called the:':
    'The **independent variable** is the one you choose and change on purpose, such as the height of a ramp or the amount of dough. The dependent variable is the one you then measure, because its value depends on your choice. Calling the measured value independent is the commonest mix-up.',
  'Why should a measurement include a unit?':
    'A number alone cannot say what was measured, because **5** could mean 5 cm, 5 m or 5 seconds. The unit names the quantity and the scale, so another student can repeat your reading exactly. Dropping the unit turns a real measurement into a meaningless figure.',
  'What is a controlled variable?':
    'A **controlled variable** is a condition you deliberately keep the same in every trial, like the amount of dough or the flame setting. Keeping it fixed means the variable you changed is the only possible cause of a difference in the result. Confusing it with the variable being tested is the usual error.',
  'Which is a testable scientific question?':
    'You can test **whether the height of a ramp changes how fast a ball rolls** by timing the ball at several heights and comparing. Questions about school timings, favourite sports or pretty colours rest on opinion, so no measurement can settle them. A scientific question must be answerable with data.',
  'Why is careful observation important in an experiment?':
    'Careful looking and measuring supplies **reliable evidence** that other people can check and repeat, instead of a guess. Observation never proves an idea in one go - it can support it or knock it down, which is why readings are taken again. Trusting a hunch over recorded data is the habit to avoid.',
  'Which tool helps observe very small objects?':
    'A **hand lens or microscope** magnifies a tiny object so details such as cells or small insects become visible. A measuring tape, stopwatch or thermometer only measures length, time or temperature and none of them enlarges what you see. Reaching for a measuring instrument when you need magnification is the usual mistake.',
  'Why should observations be recorded at once?':
    'Details fade and get reshaped in memory within minutes, so writing them down **at once** keeps the record accurate. Wait until evening and you may quietly write 45 mL where you actually read 40 mL. Recording is part of the method, not a chore done to please a teacher.',
  'A table of readings is useful because it':
    'A table lines the readings up in order, so a **pattern** such as a steady rise or fall is easy to spot. It does not hide mistakes - a wrong value usually stands out as an odd row - and it does not replace a graph, which shows the shape of the pattern. Making the report longer is not its purpose.',
  'Which part of the cell controls all its activities?':
    'The **nucleus** holds the genetic instructions and directs everything the cell does, including growth, repair and division. The cytoplasm is where many reactions happen but it gives no orders, and the cell wall only gives shape and support. Treating the largest or outermost part as the control centre is the mistake.',
  'Which scientist first observed cells in thin slices of cork in 1665?':
    'In 1665 **Robert Hooke** looked at thin cork slices through his own microscope and named the tiny empty boxes \'cells\'. Van Leeuwenhoek came later and was the first to see living cells, while Mendel studied inheritance and Pasteur studied germs. Swapping Hooke with Leeuwenhoek is the usual slip.',
  'Which is the correct order of levels of organisation?':
    '**Cell, tissue, organ, organ system, organism** - each level is built from the one before it, as similar cells group into a tissue and tissues build an organ. Swapping organ and tissue breaks that rule, since a tissue is simpler than the organ it forms. Reading from a whole organism downwards gives the reverse order.',
  'Which structure is found only in plant cells?':
    'A **cell wall** of cellulose surrounds a plant cell and gives it a firm shape, and animal cells have none. The cell membrane, cytoplasm and nucleus occur in both kinds of cell, so they cannot be the plant-only feature. The membrane is a thin living boundary, not the stiff outer wall.',
  'Put these in order from smallest to largest: organ, cell, tissue, organ system.':
    'The order is **cell, then tissue, then organ, then organ system**, because each larger unit is built from the smaller one. A tissue is a group of similar cells, an organ is made of tissues working together, and an organ system is a group of organs. Starting with the organ reverses the whole chain.',
  'Name two useful jobs done by microorganisms.':
    'Microorganisms make **curd and bread** and also break down dead waste into simple nutrients that return to the soil, and some bacteria fix nitrogen for plants. Their job is not only to cause disease. Assuming every microbe is harmful hides these everyday uses.',
  'Which part of the cell controls its activities?':
    'The **nucleus** carries the DNA instructions and decides what the cell makes and when it divides. The cell membrane only controls what enters and leaves, while the vacuole stores water and sap. Thinking that the control must sit on the outer boundary is the mistake.',
  'The jelly-like substance filling the cell is':
    '**Cytoplasm** is the jelly-like fluid that fills the cell and holds the organelles in place. The nucleus is a distinct body within it, a plastid is a food-making or colouring structure, and the cell wall is the stiff outer covering. Confusing the fluid with the structures floating in it is the usual error.',
  'Which organelle makes food in a plant cell?':
    'The **chloroplast** holds the green pigment chlorophyll, which traps sunlight so the plant can make its own food. The vacuole stores water and sap, the nucleus stores instructions, and the cell membrane controls what passes through. A storage part or a boundary cannot make food.',
  'Which is the correct order from smallest to largest?':
    '**Cell, tissue, organ, organism** - each step is built from the one before, as similar cells form a tissue and tissues form an organ. The option that starts with an organ goes from big to small, and the one starting with a tissue breaks the rule that a cell comes first. Size order must always begin at the cell.',
  'Which microorganism is used to make curd?':
    '**Bacteria** such as Lactobacillus feed on the sugar in milk and turn it sour, thickening it into curd. Protozoa and algae live mostly in water and do not curdle milk, and viruses cannot grow in milk by themselves. Assuming any microbe can make curd ignores which one really does the job.',
  'Which microorganisms are used to make bread rise?':
    '**Yeast** is a fungus that feeds on sugar in the dough and releases carbon dioxide gas, and the trapped bubbles push the dough up. Algae, protozoa and most bacteria do not give off that gas in dough. It is the gas, not the flour, that lifts the bread.',
  'According to the WHO, health is a state of complete __.':
    'The WHO defines health as complete **physical, mental and social well-being**, not merely the absence of illness. A person with no fever can still be anxious or lonely and is not fully healthy. Reading health as fitness alone or as good marks at school misses most of the definition.',
  'Diabetes is an example of a __ disease.':
    '**Diabetes** is a non-communicable disease: it comes from the body\'s own insulin problem and cannot pass from one person to another. It is not a deficiency disease either, since it is not caused by a missing vitamin in the diet. Assuming every long-term disease must be a deficiency is the slip.',
  'Why must an antibiotic course be completed fully instead of being stopped as soon as you feel better?':
    'The first doses only weaken the bacteria, so stopping early leaves the **strongest survivors** alive to multiply again. Those survivors are the ones the drug works on least, so the next infection resists it. Feeling better is not the same as being fully cured.',
  'Which of these is a communicable disease?':
    '**Dengue** passes from one person to another through the bite of an infected mosquito, so it is communicable. Diabetes, asthma and cancer begin inside the body and are not carried by contact, air or water. A disease you can catch must have a route of transmission.',
  'Antibiotics are effective against:':
    'Antibiotics attack structures that **bacteria** possess, such as their cell wall, so they cure bacterial infections like strep throat. Viruses have no cell wall and use the host cell\'s machinery, which is why a cold or flu does not respond to them. Expecting one medicine to cure every illness is the error.',
  'What is the difference between a sign and a symptom?':
    'A **sign** is something another person can see or measure, such as a rash, a high temperature or a swollen joint. A **symptom** is what only the patient feels, such as a headache or tiredness. Using the two words as if they mean the same hides this difference.',
  'Why does not completing a course of antibiotics cause resistance?':
    'A partial dose kills only the weaker bacteria, and the **strongest survivors** then multiply and pass on their toughness. The next course meets a population the same drug struggles to kill, and we call that resistance. Finishing the full course removes those survivors.',
  'Which of these is part of a healthy lifestyle?':
    '**Regular exercise and a balanced diet** keep weight, strength and immunity in good order. Fried food every day, sleeping at 3 am and skipping breakfast all strain the body and raise the risk of disease later. One good habit repeated daily is worth more than an occasional effort.',
  'Why is a clean environment important for our health?':
    'Clean surroundings remove the breeding places of mosquitoes, flies and germs, so **it stops the spread of diseases**. Safe water and proper waste disposal are the main reason cholera and diarrhoea fall. Treating cleanliness as only a matter of how the roads look misses its health value.',
  'Which habit helps keep our surroundings clean?':
    'Putting waste **only into dustbins** keeps garbage away from water sources and stops flies and rats from gathering. Spitting on the road, burning plastic in the open and leaving litter in the park all move germs and harmful fumes into the shared space. Each of those habits spreads the problem instead of removing it.',
  'Health means':
    'Health is **physical, mental and social well-being** together, as the WHO states. Being able to run fast or having strong muscles covers only the physical part, and a person with no illness may still feel lonely or worried. Absence of disease is only one piece of the picture.',
  'Which habit most supports mental well-being?':
    'Talking about feelings with **someone you trust** eases worry and stops small problems from growing big. Staying awake all night, skipping meals and avoiding all friends cut you off from support and unsettle sleep and mood. Sharing how you feel is a skill, not a weakness.',
  'A magnetic compass is placed below a wire. When the switch is closed, the compass needle gets deflected. What does this show?':
    'A current flowing through a wire sets up a **magnetic field** around it, and that field pushes the compass needle aside. Oersted noticed exactly this in 1820, which first linked electricity with magnetism. Heat cannot turn a compass needle, and the needle does not lose its magnetism.',
  'Which of the following changes will make an electromagnet stronger?':
    'Every extra **turn of the coil** adds another ring of magnetic field, so more turns give a stronger electromagnet. A longer connecting wire only adds resistance, and removing the iron nail takes away the core that concentrates the field. Reversing the cell\'s terminals swaps the poles but not the strength.',
  'Why is nichrome wire used as the heating element in appliances such as electric irons and room heaters?':
    '**Nichrome** has a much higher resistance than copper, so for the same current it turns more electrical energy into heat. Copper conducts better, which is exactly why it stays cool instead of glowing. Nichrome still conducts current - it is not an insulator - and its lightness is not the reason it is chosen.',
  'Which parts of a dry cell act as its two terminals, and why is the cell called dry?':
    'The **zinc container** is the negative terminal and the **carbon rod with the metal cap** is the positive terminal. It is called dry because the electrolyte inside is a thick moist paste, not a liquid that could spill. Assuming the whole metal case must be positive is the usual mistake.',
  'A dry cell produces electricity by':
    'Inside a dry cell, **chemical reactions** between the zinc, the moist paste and the carbon rod release energy as electrical energy. Sunlight is used only by solar cells, and friction or magnetism alone cannot drive a cell. A cell stores chemicals, and the electricity is produced as they react.',
  'What makes a rechargeable battery different from a dry cell?':
    'A rechargeable battery can be **charged again** by passing current through it in the reverse direction, which undoes the chemical change. A dry cell\'s reaction cannot be reversed, so it is thrown away once it is flat. No battery lasts forever or works without chemicals.',
  'A wire with higher resistance produces':
    'For the same current, a wire of **higher resistance** converts more electrical energy into heat, so it gets hotter. That is why a thin, long nichrome wire glows while a thick copper lead stays cool. Resistance slows the current but does not stop it.',
  'Which appliance works mainly on the heating effect of current?':
    'An **electric iron** changes electrical energy into heat in its nichrome element, which is the heating effect of current. A fan and a loudspeaker use the magnetic effect to spin a motor or vibrate a cone, and a doorbell uses an electromagnet to strike a gong. Heat is not what moves those parts.',
  'What did Oersted discover?':
    '**Oersted** found that a compass needle swings when current flows in a nearby wire, proving that a current creates a magnetic field. He never claimed that current flows only in coils, nor that magnets produce light. That one small observation began the study of electromagnetism.',
  'The magnetic field around a straight wire is':
    'The field forms **circles around the wire**, lying in planes at right angles to it. It is not along the wire, and it is not absent while current flows. Reversing the current only reverses the direction in which those circles go round.',
  'How can an electromagnet be switched off?':
    'An electromagnet is magnetic only while current flows, so **stopping the current** switches it off at once. Cooling the coil does nothing, and pulling out the iron core only weakens the field. This instant on-off control is what a permanent magnet cannot offer.',
  'Why is an electromagnet used in a scrap yard?':
    'A scrap-yard electromagnet lifts **iron and steel** scrap and then drops it the moment the current is switched off. It does not attract plastic or aluminium, and it needs electricity to work. A permanent magnet could pick the load up but could not let go of it.',
  'A rubber band is stretched and its length increases. Which effect of force does this show?':
    'Stretching makes the rubber band longer, so the force has changed its **shape**. The band is not speeding up or turning, and a force of this kind does not change its mass. Judging every force by speed alone misses this third effect.',
  'Which of the following is a non-contact force?':
    '**Gravitational force** pulls from a distance, so the Earth pulls a falling stone through empty air without touching it. A bat hitting a ball and muscular force both need contact, and friction needs two surfaces rubbing. A force that needs touching is a contact force.',
  'A small steel coin sinks in water, but a bigger wooden block placed in the same water floats. Which statement explains this?':
    'The wood floats because the **upthrust** on it equals its weight, while the steel coin\'s weight is greater than the upthrust, so it sinks. Size alone does not decide floating - density does, and steel is much denser than water. Water never pushes an object downwards to make it sink.',
  'An object has a mass of 1 kg. Its weight is about 10 N on the Earth but only about 1.6 N on the Moon. Explain why the mass stays the same while the weight changes.':
    '**Mass** is the amount of matter in the object, so 1 kg stays 1 kg everywhere you take it. **Weight** is the pull of gravity on that matter, and the Moon\'s gravity is about one-sixth of the Earth\'s, so 10 N becomes about 1.6 N. Weight changes with gravity, but the matter does not.',
  'A force can change an object\'s':
    'A force can change an object\'s **shape, speed or direction** - bending a rod, slowing a rolling ball or turning it aside. Its mass, temperature and colour are not altered as a direct effect of the push or pull. Force explains changes in motion, not changes in matter.',
  'Opening a door is an example of':
    'Opening a door means pushing the handle away from you or pulling it towards you, so it is a **push or a pull**. Gravity and friction act on the hinge, but neither is the force you apply to move the door. Every force you apply with your body is a push or a pull.',
  'Which is a non-contact force?':
    '**Magnetic force** acts across a gap, so a magnet can move an iron pin without touching it. Muscular force needs your body to press on the object, and friction and air resistance both need surfaces in contact. Acting at a distance is what makes a force non-contact.',
  'Which force acts only when two surfaces touch?':
    '**Friction** arises only where two surfaces are pressed together and slide, or try to slide, so it vanishes once they separate. Gravity and magnetic force act across gaps, and electrostatic force can pull a charged balloon without touching it. Contact is friction\'s defining condition.',
  'Mass is measured in':
    '**Mass** is measured in kilograms, the unit of the amount of matter. Newtons measure weight, which is a force, while metres measure length and litres measure volume. Reporting a weight in kilograms is the commonest unit mix-up.',
  'Weight of an object changes with':
    'Weight is the pull of gravity, so it changes with **the strength of gravity** - 10 N on Earth becomes about 1.6 N on the Moon. Temperature, shape and colour make no difference to it, while the mass stays the same everywhere. Only gravity changes the weight of a given object.',
  'An object floats when upthrust is':
    'An object floats when the **upthrust equals or exceeds its weight**, so the forces balance or the upward push wins. If the upthrust is less than the weight, the object sinks to the bottom. Comparing upthrust with mass mixes a force with a quantity of matter.',
  'Upthrust on an object in water acts':
    '**Upthrust** is the upward push a fluid gives a body placed in it, so it acts upwards, against gravity. It is not sideways and not zero, because the water pressure on the bottom of the object is greater than on the top. That difference in pressure is what holds a boat up.',
  'Pressure is defined as':
    'Pressure measures how concentrated a push is: **force per unit area**, written P = F/A and measured in pascal (Pa). The same force spread over half the area gives twice the pressure, which is why a drawing pin\'s point sinks in easily. Mass per unit volume is not a pressure at all - that quantity is density.',
  'A rubber sucker pressed on a smooth flat surface is hard to pull off. Why does it stick?':
    'Pressing the sucker squeezes air out, so the pressure inside it falls, and the **air pressure outside is greater** and pushes the rubber firmly onto the surface. Pulling it off means overcoming that outside push. If the pressure inside were higher, it would push the sucker away instead of holding it.',
  'Why is it safer to keep the doors and windows of a house open during a storm with very high-speed winds?':
    'Fast-moving air over the roof has low pressure, so the ordinary pressure inside the house can push the roof upwards. With **doors and windows open**, air moves in and out, the inside pressure drops, and the difference across the roof shrinks. Wind does enter an open house - it does not stay outside.',
  'What is the eye of a cyclone, and what is the weather like in that region?':
    'The eye is the **calm centre of a cyclone**, a roughly circular region of lowest pressure where winds are light and the sky may even be clear. Around it, the eyewall carries the strongest winds and the heaviest rain. It forms because air spiralling inward rises and leaves a hollow core.',
  'Pressure equals':
    'Pressure is **force divided by area**, so a 100 N push on 2 m2 gives 50 Pa. Doubling the area for the same force halves the pressure, which is why wide straps and snowshoes feel comfortable. Force multiplied by area is not a meaningful quantity here, and area divided by force would make pressure smaller when the area shrinks.',
  'Why does a sharp knife cut better than a blunt one?':
    'A sharp edge touches the food over a tiny area, so **the same force acts on a much smaller area** and the pressure becomes very large, letting the blade slice through. A blunt knife spreads that force over a wide edge, so the pressure is small. Extra mass helps a little, but sharpness works through area, not weight.',
  'Atmospheric pressure is caused by':
    'Air has weight, and the tall column of air above you presses down on everything, so atmospheric pressure comes from **the weight of the air above us** - about 100,000 Pa at sea level. The Moon\'s gravity is far too weak and far too distant to press our air down. Heat and rotation move air about, but they do not give it weight.',
  'Atmospheric pressure decreases as we':
    'As we **go higher above sea level** there is less air above us, so the weight pressing down is smaller and atmospheric pressure falls - that is why climbers puff on mountains. Going deeper into a mine adds more air above you, so the pressure rises instead.',
  'Wind blows from':
    'Air always moves from a **high pressure area to a low pressure area**, because the extra push on the high side drives it towards the crowded low side. The bigger the difference between the two areas, the faster the wind blows. The reverse direction would mean air pushing itself into the already crowded region.',
  'High-speed winds form when':
    'Wind is driven by differences in air pressure, so **the pressure difference between two areas is large** when air rushes in fast - this is how cyclones get their fierce winds. Gentle breezes mean nearly equal pressures. Rain usually comes with a storm, but it is a result of the rising air, not the cause of the wind.',
  'Lightning is caused by':
    'Friction between rising air and water droplets builds up electric charge in a cloud, and when the charge grows large enough a **huge electric discharge** jumps to the ground or to another cloud as lightning. The flash heats the air so fast that it expands and you hear thunder. Wind rubbing the ground is not the source of this charge.',
  'A cyclone is':
    'A cyclone is **a large rotating storm with very low pressure at its centre**, where air rushes inward, spirals up and drops heavy rain over hundreds of kilometres. The low-pressure core and closed circulation are what make it a storm system. A short shower and a hot dry wind like the loo have neither.',
  'What is a constituent particle of a substance?':
    'A constituent particle is **the basic unit that makes up a larger piece** of a substance - however far you crush a sugar crystal, the smallest bit that is still sugar is its particle. It is far too small to see with the naked eye or an ordinary microscope. A mixture of two substances is not a particle of either.',
  'Which state of matter has a definite volume but no fixed shape?':
    'A **liquid** keeps its volume but takes the shape of the container it is poured into, because its particles stay close together yet slide past one another. A solid keeps a fixed shape as well, while a gas keeps neither volume nor shape.',
  'Sugar is added to water in a glass and stirred until it dissolves. The final level of the solution is lower than the level reached just after adding the sugar. What does this show?':
    'Water particles are not packed tightly - there are **empty spaces between them**, and the dissolved sugar particles slip into those gaps, so the level settles lower than the sugar pile suggested. Nothing is destroyed: the sugar is still there and the water tastes sweet. Escaping vapour would carry water away, not sugar.',
  'Define the melting point and the boiling point of a substance.':
    'The **melting point** is the fixed temperature at which a solid turns into a liquid at atmospheric pressure, such as 0 C for ice. The **boiling point** is the fixed temperature at which a liquid turns into vapour throughout its bulk, such as 100 C for water. Each pure substance has its own pair of values.',
  'Matter is made up of':
    'All matter is built from **very small particles** - atoms and molecules - with empty space between them, whether the material is a stone, milk or air. Treating matter as one continuous solid cannot explain dissolving, diffusion or squeezing a gas. Not everything is made of gold, and air itself is matter made of particles.',
  'Which observation shows that particles of matter are very small?':
    'A single drop of ink colours a whole glass of water without any separate bits being visible, so the colouring particles must be **extremely small** and must spread into the gaps between water particles. Whether a stone sinks or ice floats tells you about density, not about particle size.',
  'Particles of a gas are far apart, so a gas':
    'Because the particles of a gas are **far apart with lots of empty space**, pushing on it brings them closer, so a gas can be compressed easily. That same spacing is why a gas has no fixed shape, flows freely and has a very low density. A fixed shape belongs to a solid.',
  'Solids have a fixed shape because their particles':
    'In a solid the particles are **held closely together with strong attraction**, so each one can only vibrate about a fixed position and the shape does not change on its own. Particles that move about freely belong to a liquid or a gas. Having mass does not decide whether a shape is fixed.',
  'The temperature at which a solid becomes a liquid is its':
    'The fixed temperature at which a solid changes into a liquid is its **melting point** - 0 C for ice. The boiling point is where a liquid becomes a gas, and the freezing point is the same value reached while cooling, named from the other direction. Dew point describes water vapour condensing out of air.',
  'At the boiling point a liquid':
    'At the boiling point the vapour pressure inside equals the air pressure, so bubbles of vapour form **throughout the liquid**, not just at its surface, and the whole liquid changes into a gas. Evaporation from the surface only happens at temperatures below the boiling point, so it is not the same process.',
  'Which state has a definite volume but no definite shape?':
    'A **liquid** has particles close enough to hold a definite volume, but loose enough to slide, so it takes the shape of its container. A solid fixes both shape and volume, while a gas fixes neither. Plasma, like the glowing gas in a tube light, behaves like a gas and has no fixed volume.',
  'Which state has neither a definite shape nor a definite volume?':
    'A **gas** spreads out to fill any container because its particles are far apart and move freely, so it keeps neither a definite shape nor a definite volume. A liquid holds on to its volume, and a solid keeps both. Plasma also flows and fills its container, but the everyday answer for this pair of missing properties is a gas.',
  'Sugar dissolved in water gives a mixture in which the components cannot be seen separately even with a microscope. Such a mixture is called':
    'When the parts are spread so evenly that you cannot pick them out even under a microscope, the mixture is **uniform**, also called homogeneous. A compound is a new substance formed by chemical combination, an element is one kind of atom, and a non-uniform mixture still shows separate parts.',
  'Which of the following is an element?':
    '**Sulfur** is an element: every particle in it is a sulfur atom and nothing else. Water (H2O), common salt (NaCl) and iron sulfide (FeS) are each built from two elements chemically joined, so all three are compounds, not elements.',
  'Iron filings and sulfur powder are mixed and then heated strongly to give a black mass. Which observation shows that a compound has been formed and not a mixture?':
    'Heating makes iron and sulfur combine chemically into iron sulfide, which is **not attracted by a magnet**, and the iron and sulfur can no longer be separated from it. In a mixture the iron would still jump to a magnet and the yellow sulfur would still be visible.',
  'What does the word pure mean in science, and what kind of particles does a pure substance contain?':
    'In science **pure** means a single substance with nothing else mixed into it, so it cannot be separated into other kinds of matter by any physical process. A pure substance consists of one type of particle throughout, whether atoms of an element or molecules of a compound. A clean-looking mixture such as sea water is still not pure.',
  'A mixture in which the parts can be seen separately is':
    'When the different parts can still be seen as separate pieces - like sand and iron filings, or oil floating on water - the mixture is **non-uniform**, also called heterogeneous. A uniform mixture looks the same throughout, while a compound or an element is a single substance rather than a visible blend.',
  'Sugar dissolved in water forms':
    'Sugar disappears completely and the sweet liquid looks the same everywhere, so it is a **uniform mixture**, also called a solution. An element is one kind of atom, a suspension has visible particles that settle, and a non-uniform mixture would still show separate parts.',
  'Which is a pure substance?':
    '**Distilled water** contains only water particles, so it is a pure substance in the scientific sense. Air is a mixture of several gases, milk is water with fat and protein, and sea water carries dissolved salts and other material, so none of those three is pure.',
  'Which method separates a dissolved solid from water?':
    'A dissolved solid passes straight through filter paper, so you must **evaporate** the water and let the solid come back as crystals. Hand picking and sieving need visible separate pieces, and filtration only traps particles that were never dissolved.',
  'An element is a substance made of':
    'An element is made of **only one kind of atom**, such as iron (Fe) or oxygen (O2), and it cannot be split into simpler substances by chemical means. Two or more kinds of atoms joined in a fixed ratio make a compound, and a random mixture of atoms is just a mixture.',
  'Which of these is an element?':
    '**Iron** is an element: every particle in a piece of iron is an iron atom. Salt is sodium chloride, water is hydrogen joined to oxygen, and air is a mixture of several gases, so those three are a compound, a compound and a mixture.',
  'In a compound the elements are combined':
    'In a compound the elements always combine in a **fixed ratio by mass** - water is always 1 g of hydrogen to 8 g of oxygen. That is why a compound has a definite chemical formula and a fixed melting point. A mixture, by contrast, can be made in any proportion at all.',
  'Which of these is a compound?':
    '**Water** is a compound: hydrogen and oxygen are chemically joined inside every water molecule, and you cannot separate them by filtering or boiling. Oxygen and iron are elements, and air is a mixture of gases rather than a compound.',
  'When sugar is dissolved in water to make a solution, the sugar is the':
    'The substance that dissolves is the **solute**, so the sugar is the solute and the water is the solvent; together they form the solution. A suspension is not part of a solution at all - it is a mixture whose particles settle on standing.',
  'At a particular temperature, salt is added to water and stirred. After some time the added salt stops dissolving and settles at the bottom. The solution is now':
    'When no more salt can dissolve at that temperature and the extra salt collects at the bottom, the solution is **saturated**. A dilute solution still has plenty of room for more solute, and an unsaturated one would keep dissolving the salt instead of leaving it behind.',
  'Some baking soda remains undissolved at the bottom of water at 20 degrees Celsius. When the water is heated to 50 degrees Celsius, this baking soda dissolves. What does this show?':
    'More baking soda dissolves in water at 50 C than at 20 C, so its **solubility increases with temperature** - warming the water lets it hold more dissolved solid. Baking soda does not melt at 50 C, and a chemical reaction would create a new substance rather than simply dissolving the same powder.',
  'Define density and state its SI unit.':
    'Density is the **mass present in a unit volume**: density = mass / volume, and its SI unit is the **kilogram per cubic metre (kg/m3)**. A block of 2 kg occupying 0.001 m3 has a density of 2000 kg/m3, which is why density lets you compare materials fairly whatever their size.',
  'In salt water, the solvent is':
    'The solvent is the liquid that does the dissolving, so in salt water the **water** is the solvent and the salt is the solute. The solution is the mixture as a whole, not one of its parts, and air plays no role unless the water is exposed to it.',
  'The substance that dissolves in a solvent is the':
    'The substance that dissolves is the **solute**, and it is usually the one present in the smaller amount. The solvent is the liquid that does the dissolving, and the two together make the solution. A suspension is a different kind of mixture altogether.',
  'For most solids, raising the temperature of water':
    'For most solids, dissolving needs energy to pull the particles apart, so **raising the temperature increases how much dissolves** - far more sugar dissolves in hot tea than in cold water. Cooling a saturated solution usually makes the extra solute reappear as crystals.',
  'Solubility means':
    'Solubility is the **maximum amount of solute** that can dissolve in a given amount of solvent at a given temperature, often quoted as grams per 100 g of water. Colour, density and boiling speed are different properties and have nothing to do with how much dissolves.',
  'A solution that cannot dissolve any more solute at that temperature is':
    'A solution that can hold no more solute at that temperature is **saturated**, so any extra solute simply settles at the bottom. It is not dilute, because dilute means only a little solute has dissolved, and it is not unsaturated, because an unsaturated solution can still dissolve more.',
  'An object floats in water when its density is':
    'An object floats when its **density is less than that of water**, about 1000 kg/m3, so the upward push of the water balances its weight before it sinks fully. Wood at roughly 600 kg/m3 floats, while iron at roughly 7800 kg/m3 sinks. Density is mass per volume, so comparing it to a volume mixes up two different quantities.',
  'Density is calculated as':
    'Density is **mass divided by volume**, d = m/V - a 200 g block of 50 cm3 has a density of 4 g/cm3. Volume divided by mass gives the opposite number and is not density, and force divided by area is pressure, a different quantity.',
  'A dilute solution contains':
    'A dilute solution holds **a small amount of solute in a large amount of solvent**, so its taste or colour is weak. A saturated solution holds the maximum solute possible, and a solution cannot have no solute at all - with none dissolved there is nothing to call a solution.',
  'Which spherical mirror has a reflecting surface that curves outwards?':
    'A **convex mirror** bulges towards you, so its reflecting surface curves outwards and it always gives a small, upright image with a wide field of view. A concave mirror curves inwards like the hollow of a spoon, and a plane mirror or a plain glass plate is flat.',
  'A ray of light strikes a plane mirror. The angle between the incident ray and the normal is 30 degrees. What is the angle of reflection?':
    'The law of reflection says the angle of incidence equals the angle of reflection, and both are measured from the **normal**, so the reflected ray also leaves at **30 degrees**. Subtracting from 90 gives 60 only if you wrongly measured from the mirror surface, and 150 comes from subtracting from 180.',
  'A student wants to burn a small hole in a sheet of paper using sunlight. Which arrangement will work?':
    'A **concave mirror** brings parallel sunlight together at a real focus, and at that bright spot the concentrated energy scorches the paper. A convex mirror and a concave lens spread light out instead of collecting it, and a plane mirror only reflects a broad beam that never concentrates.',
  'How can you tell a convex lens from a concave lens by looking at the shape of the lens?':
    'Look at where the lens is thick: a **convex lens is thicker in the middle** than at its rim, like a lentil, while a **concave lens is thinner in the middle** and thicker at its rim. That shape decides whether parallel rays bend together or spread apart, so the outline alone tells you which lens it is.',
  'Which mirror is used as a vehicle rear-view mirror?':
    'A **convex mirror** is fitted because it gives a wide field of view and always shows an upright, diminished image, so the driver sees more of the traffic behind. A concave mirror would magnify objects and could show them upside down, and a lens is not a mirror at all.',
  'A concave mirror can':
    'A concave mirror curves inwards, so parallel rays falling on it are reflected so that they **converge to a focus**, which is why it can concentrate sunlight or form a real image. A convex mirror is the one that spreads light out. A mirror reflects light; it does not stop it or turn it into heat only.',
  'The angle of incidence is always':
    'By the law of reflection, the angle of incidence is always **equal to the angle of reflection**, and both are measured from the normal. That is why a ray arriving at 30 degrees to the normal leaves at 30 degrees - not at 60, which would come from measuring from the mirror surface.',
  'The incident ray, the reflected ray and the normal all lie':
    'The incident ray, the reflected ray and the normal at the point of incidence all lie **in the same plane** - this is the second part of the law of reflection. They are not inside the mirror, and the normal is perpendicular to the surface, not at right angles to the rays.',
  'A convex lens is thicker':
    'A convex lens is **thicker in the middle** than at its edges, which is why it is also called a converging lens - it bends parallel rays towards the centre. A lens that is thicker at its edges than in the middle is concave, and its thickness is not the same everywhere.',
  'A concave lens is used to correct':
    'A **concave lens** diverges light, which pushes the image back so that a short-sighted person, who sees near objects clearly but distant ones blurred, can focus on far objects. Long-sightedness needs a convex lens, and colour blindness or night blindness is not corrected by changing the shape of the lens.',
  'A convex lens makes parallel rays':
    'A convex lens bends parallel rays inwards so that they **converge to a point** called the principal focus, at a distance equal to its focal length. A concave lens is the one that makes parallel rays diverge outwards, and a convex lens never leaves them parallel.',
  'Which lens spreads parallel rays apart?':
    'A **concave lens** is thinner in the middle, so rays passing through it are bent away from the axis and spread apart, which is called divergence. A convex lens brings parallel rays together, and a plane mirror reflects light instead of letting it pass through.',
  'What colour is the house in the poem "A Happy Child"?':
    'The poem says the child\'s house is **red and white**, so those two colours go together. Yellow and brown is wrong because no part of the house is yellow.',
  'Which house did the wolf NOT blow down?':
    'The wolf huffed and puffed but the **house of bricks** stood still, so he could not blow it down. The straw house is wrong because it fell at the very first puff.',
  'Why could the wolf not blow down the brick house?':
    'Bricks are heavy and fixed together, so the **strong brick house** did not move when the wolf blew. A house built quickly from straw is weak, so it falls at once.',
  'Write one pair of rhyming words from the poem.':
    'Rhyming words end with the same sound, like **white and bright**, or day and play. Words like house and garden sound different at the end, so they do not rhyme.',
  'Which word rhymes with \'white\' in the poem \'A Happy Child\'?':
    'White and **bright** both end with the same ite sound, so they rhyme. Play has an ay sound at the end, so it does not match white.',
  'Which pair of words rhymes?':
    'Day and play both end with the **ay** sound, so they rhyme nicely. Child and garden end with different sounds, so they do not rhyme.',
  'How do we keep the beat of a poem?':
    'We keep the beat by clapping **once for each strong beat** as we say the poem. Reading it as fast as we can mixes the beats up and the rhythm is lost.',
  'What did the first little pig build his house with?':
    'The first little pig made his house of **straw** because it was quick and easy. Sticks were used by the second pig, so they are not the first house.',
  'Which house did the wolf fail to blow down?':
    'The wolf could not move the **house of bricks**, so the pigs were safe inside. The house of straw fell down, so it is not the one that stayed.',
  'Why did the brick house stay standing?':
    'The third pig took his time and laid each brick well, so the **brick house** stayed standing. The wolf was not tired; he blew his hardest and still failed.',
  'Which pig worked the hardest in the story?':
    'The **pig who built with bricks** worked the longest and hardest of the three. The pig with straw finished in a minute and then went off to play.',
  'What does the story of the three little pigs teach us?':
    'The story shows that **hard work and doing a job properly** kept the pigs safe from the wolf. It does not say building is easy, because the quick houses fell down.',
  'What does \'huff and puff\' mean?':
    'To huff and puff means to **blow hard** with a big breath, as the wolf did at the door. Running fast is a different action, so it does not match the words.',
  'What does the child in the poem use after a bath?':
    'After the bath the child uses a **towel** to get dry and warm. A brush is for the hair, not for drying the wet body after a bath.',
  'Who became friends and went into the forest?':
    'The three friends are the **bubble, the straw and the shoe**. The cat, rat and bat are animals from other tales, so they are not in this story.',
  'Why did the bubble burst in the story?':
    'The straw broke in the water, so the **bubble** fell in and burst. The bubble did not fly away, because it could not float once the straw gave way.',
  'Name any two action words (verbs) from the poem.':
    'Action words tell us what someone does, so **dry** and **rub** are action words. A word like towel only names a thing, so it does not show an action.',
  'Which word is an action word?':
    '**Rub** is something you do, so it is an action word. Wet tells us how something feels, and hand and towel are only names of things.',
  'In the poem \'After a Bath\', what does the towel do?':
    'The towel goes over the child\'s body and **dries** it. The water does the washing, so the towel does not wash the child.',
  'Which of these is NOT an action word?':
    'A **towel** is a thing you can hold in your hand, not something you do. Dry, rub and wash are all things a person can do.',
  'Who were the three friends in the story?':
    'The three friends are a **bubble, a straw and a shoe**. A pig and a wolf come from another story, so they are not in this one.',
  'What did the three friends need to cross?':
    'A **stream** of water was in their way, so they had to cross it. A brick wall is something to climb over, not water to cross.',
  'What happened to the bubble at the end of the story?':
    'When the straw broke, the bubble fell in the water and **burst** with a small pop. It did not fly away, because the water pulled it down.',
  'How did the friends try to cross the stream?':
    'The straw lay across as a **bridge** and the shoe floated like a boat. They did not swim together, because a bubble cannot swim at all.',
  'What does the story teach us?':
    'The friends tried to help one another, but their plan was not **safe**, so it failed. Straw is not stronger than a shoe, so that is not the lesson.',
  'What is a \'stream\'?':
    'A stream is a **small river** of moving water that flows on the ground. A sea is huge and salty, so it is not at all the same as a small stream.',
  'Which animal says "mew"?':
    'A **kitten** is a baby cat, and cats say mew when they want milk. A dog says bow-wow, so it is not the animal that says mew.',
  'What did Lalu eat at first?':
    'Lalu would eat **only yellow food** like corn and yellow fruit. Green vegetables were pushed away, so they were not his first choice.',
  'What did Lalu learn from Peelu?':
    'Peelu showed Lalu that he must eat **many kinds of food**, not only yellow ones. Eating just one colour made Lalu weak and tired.',
  'Count and write the number names from one to five.':
    'The number names in order are **one, two, three, four, five**. Skipping a number breaks the order, so we say each one in its turn.',
  'Which animal says \'mew\'?':
    'A **kitten** says mew, which is a small soft sound. A hen says cluck and a cow says moo, so they are not the ones that mew.',
  'Which animal says \'moo\'?':
    'A **cow** says moo, a long low sound we hear in the green field. A cat says mew instead, so it is not the animal that moos.',
  'The poem counts the animals. Which number comes just after three?':
    'When we count one, two, three, **four** comes right after three. Two comes before three, so it cannot be the number after three.',
  'What colour food did Lalu the chick want to eat?':
    'Lalu the chick wanted only **yellow** food to eat at first. Red food and green food were pushed away and left on the plate.',
  'Who was Lalu\'s friend in the story?':
    '**Peelu** was the friend who talked to Lalu and showed him better food. Mittu is a parrot from another story, so he is not in this one.',
  'Why did Lalu feel weak?':
    'Lalu said no to **green vegetables and fruit**, so his body did not get what it needs. He was not weak from running, because he ate so little.',
  'What did Lalu learn to eat?':
    'Lalu learned to eat **many kinds of food**, not just one colour. Yellow food alone had made him weak, so he changed his meals.',
  'What keeps our body strong and healthy?':
    'A **balanced diet** with many kinds of food keeps the body strong. Food of only one colour leaves out what the body needs.',
  'What does \'peck\' mean?':
    'To peck is to **pick up food with the beak**, as hens and chicks do. Flying high is a different action, so it does not mean peck.',
  'Where was the little bird sitting?':
    'The poem begins with the bird sitting **at the window**. A nest is where a bird sleeps, but here the bird was on the window.',
  'Who helped Mittu get the yellow mango?':
    'Mittu\'s **friends** helped him reach the mango on the tree. He did not get it alone, because the mango was too high for him.',
  'What did the little bird do when the speaker asked it to stop?':
    'The bird said **no** and flew away from the window at once. It did not stay to sing, because it wanted to go on its way.',
  'Why did Mittu share the mango?':
    'His friends helped him get the mango, so he **shared** it with them. Sharing made them all happy, and that is what the story teaches.',
  'Which of these is a polite word?':
    '**Please** is a polite word we use when we ask for something. Stop is a sharp word with no softness, so it is not polite.',
  '\'Will you stop?\' is an example of':
    'Will you stop asks someone to do something, so it is a **request**. A command would be a plain order like stop, with no question.',
  'What should we do when we see a bird?':
    'We should **watch it without catching it**, so the bird stays free and happy. Putting it in a cage takes away its home in the sky.',
  'What kind of bird is Mittu?':
    'Mittu is a **green parrot** with a sharp curved beak and bright wings. A sparrow is small and brown, so it is not Mittu.',
  'What did Mittu want from the tree?':
    'Mittu wanted the **big yellow mango** that was hanging high on the tree. A green leaf is not sweet fruit, so it was not what he wanted.',
  'Who else wanted the mango?':
    'A **crow and a monkey** also wanted the mango on the tree. The bubble and the shoe belong to another story, so they are not here.',
  'How did the friends finally get the mango?':
    'The friends got the mango because they **worked together**. The monkey alone could not reach it, so he needed their help.',
  'What did the friends do with the mango?':
    'They cut the mango into pieces and **shared** it with one another. They did not throw it away, because they had all worked hard for it.',
  'What is the moral of the story of Mittu?':
    'Mittu asked for **help** and then shared the fruit, and everyone was happy. Monkeys are not lazy; in this story the monkey helped him.',
  'How does a merry-go-round move?':
    'A merry-go-round goes **round and round** in a big circle. It does not go in a straight line, because it turns on one spot.',
  'Which of these is a circle?':
    'A **wheel** is round like a circle, with no corners at all. A book has four sharp corners, so it is a rectangle, not a circle.',
  'Name two things in your home that are round.':
    'A **plate and a bangle** are both round, so they are good answers. A door is tall and straight, so it is not round at all.',
  'Why can a circle roll but a square cannot?':
    'A circle has **no corners**, so it rolls smoothly on its edge. A square has four corners that stop it and make it slide instead.',
  'Which word rhymes with \'round\'?':
    'Round and **sound** both end with the ound sound, so they rhyme. Down has a different vowel sound, so it does not rhyme with round.',
  'Which word rhymes with \'down\'?':
    'Down and **town** both end with the same own sound, so they rhyme well. Round ends with ound, so it does not match the sound of down.',
  'Which of these is a sound word?':
    '**Wheee** is a sound word, because it copies the noise of the ride. A wheel is a thing you can touch, so it is not a sound.',
  'Which of these things is round?':
    'A **coin** is round and flat, like a small circle in your hand. A box has flat sides and sharp corners, so it is not round.',
  'How many corners does a circle have?':
    'A circle is a smooth curve all the way, so it has **no corners at all**. Four corners belong to a square, not to a circle.',
  'Which shape can roll easily?':
    'A **circle** rolls easily because its edge is smooth all the way round. A triangle has three corners, so it tips over instead of rolling.',
  'Which of these is shaped like a circle?':
    'The **sun** looks like a big round circle up in the sky. A brick has flat sides and sharp corners, so it is not shaped like a circle.',
  'Which way does a merry-go-round move?':
    'It turns **round and round** on its middle, again and again. It does not go only up and down, because it spins in a circle.',
  'What is a corner?':
    'A corner is the **point where two sides meet**, like the corner of a book. The middle of a shape is empty space, so it is not a corner.',
  'How does the child feel on the first day of school?':
    'The child feels **nervous at first**, and then he becomes happy when he makes friends and plays. Feeling angry the whole day misses how the day changes from shy to glad.',
  'Who did Haldi meet on her way?':
    'On her way Haldi meets a **duck, a cat and a cow**. A lion and a tiger never come into this story, so that answer is only a guess.',
  'Name two feelings the child has on the first day of school.':
    'On the first day the child is **nervous and happy**, and he is also a little shy and excited. Just writing \'good\' names no real feeling, so it leaves the question half answered.',
  'What did Haldi do when she came home?':
    'When Haldi came home she **told her mother everything** about the animals she met. Saying she stayed out late misses the ending, because the story finishes with her sharing her news at home.',
  'Which of these words names a feeling?':
    '**Shy** names a feeling, because it tells us how someone feels inside. Board, classroom and desk are only things in a room, so they cannot be feelings.',
  'The child feels nervous on the first day. What does \'nervous\' mean?':
    '**Nervous** means a little afraid or worried, like the child on his first school day. It does not mean very hungry, because hungry is a feeling in the tummy, not in the mind.',
  'How can we tell someone how we feel?':
    'We tell someone how we feel by saying **\'I feel\' and then the feeling**, like \'I feel happy\'. Hiding your face or staying quiet all day keeps the feeling locked inside, so nobody learns it.',
  'Who is Haldi in the story?':
    'Haldi is a **little girl who goes out to see the world**. She is not a teacher or a parrot, because she is a child who walks, talks and asks questions.',
  'Which animals did Haldi meet on the way?':
    'Haldi meets a **duck, a cat and a cow**, and each one teaches her something new. A fish, a frog and a snake are not in this story, so that list cannot be right.',
  'What does \'curious\' mean?':
    '**Curious** means wanting to know more, so you ask questions and look closely at things. It is not the same as being angry, because anger does not make you want to learn.',
  'According to the story, what helps us learn?':
    'The story shows that being **curious and brave** helps us learn, because we go out and ask about new things. Never asking questions keeps us from finding anything out.',
  'What is an \'adventure\'?':
    'An **adventure** is an exciting journey where new and surprising things happen. A school test is work in a room, so it is not a journey at all.',
  'What did Haldi learn from the animals she met?':
    'Haldi learns **something new from each animal** she meets on her walk. The story never says the animals were dangerous, so that fear is not part of her day.',
  'Which word in the poem shows ability?':
    '**Can** shows ability, because it tells what someone is able to do, as in \'I can hop\'. \'Cannot\' shows just the opposite, so it says what someone is not able to do.',
  'Which of these is a need, not a want?':
    '**Water** is a need, because we must have it every day to live and stay well. An ice cream is only a want, a sweet fun thing we can live without.',
  'Write two things you can do well.':
    'The poem keeps saying **\'I can\'**, so a good answer names a real skill, like \'I can swim\' or \'I can sing\'. Writing \'I like mangoes\' tells what you enjoy, not what you are able to do.',
  'Why should we say "please" when we ask for something?':
    'We say **please** because kind words show good manners, and people feel happy to help us. Demanding \'give me now\' sounds rude, so others may not want to help.',
  'The poem \'I am Lucky\' says we should be thankful for':
    'The poem asks us to be thankful for **what we have**, like food, family and friends. Wanting only what other people have makes us forget our own good things.',
  'Which of these things does the speaker say he can do?':
    'The speaker says **\'I can hop\'**, and he also names other small things he can do. Driving a car is a job for grown-ups, so a child in the poem does not claim it.',
  'What does \'lucky\' mean?':
    '**Lucky** means having good fortune, so good things happen to you. Being very tall is only how you look, so it does not tell us about luck.',
  'Which words help us ask politely?':
    '**Please** and **may I** are polite asking words, as in \'May I have some water, please?\'. Saying \'give me now\' orders people about, so it does not sound polite.',
  'Which is the polite way to ask for water?':
    'The polite way is **\'May I have some water, please?\'**, because it uses kind asking words. \'Give me water\' is an order, so it does not show good manners.',
  'What does \'polite\' mean?':
    '**Polite** means showing good manners, so we speak softly and say please and thank you. Speaking very loudly can disturb other people, so that is not polite.',
  'Which of these is a NEED?':
    '**Food** is a need, because our body must have it every day to grow and work. A toy car is only a want, a fun thing we can live without.',
  'Which of these is a WANT?':
    'A **new toy** is a want, because it is fun but we can live without it. Food and water are needs, since our body must have them to stay alive.',
  'What did the mother explain to the child?':
    'The mother explains that we **cannot get everything we want**, so we must know needs from wants. She never says toys are free in shops, because that is not true.',
  'What does a smile cost?':
    'A smile costs **nothing**, because it is free and we can give it to anyone. It does not need a rupee or a gift, so money has nothing to do with it.',
  'What made the traveller take off his coat?':
    'The **warm sun** made the traveller take off his coat, because he began to feel hot. The strong wind only made him hold the coat tighter, so wind did not do it.',
  'What is the moral of "The Wind and the Sun"?':
    'The moral is that **gentleness wins where force fails**, just as the warm sun did what the strong wind could not. Pushing hard, like the wind, only makes people hold on tighter.',
  'Write two words that rhyme with "smile".':
    'A rhyming word ends with the same sound, so **while** and **mile** rhyme with smile. \'Day\' ends with an \'-ay\' sound, so it does not rhyme with smile.',
  'Which word rhymes with \'smile\'?':
    '**While** rhymes with smile, because both words end with the same \'-ile\' sound. \'Sun\' ends with a different sound, so the two words do not match.',
  'Which word rhymes with \'day\'?':
    '**Say** rhymes with day, because both end with the \'-ay\' sound. \'Smile\' ends with \'-ile\', so it does not rhyme with day.',
  'Which word does NOT rhyme with \'smile\'?':
    '**Day** does not rhyme with smile, because it ends with \'-ay\' and smile ends with \'-ile\'. Mile, tile and while all end like smile, so those three do rhyme.',
  'What did the wind and the sun argue about?':
    'The wind and the sun argued about **who was stronger**, and they tested it on a traveller. They never argued about age or speed, so those answers miss the point.',
  'What did the wind and the sun want the traveller to take off?':
    'Both wanted the traveller to take off **his coat**, because that would show who was stronger. They did not care about his shoes or his hat at all.',
  'Whom did the wind and the sun see on the road?':
    'They saw a **traveller in a coat** walking on the road below them. There was no child with a ball in this story, so that answer does not fit.',
  'What happened when the wind blew as hard as it could?':
    'When the wind blew hard, the traveller **held his coat tighter** and did not take it off. The wind thought force would work, but it only made the man feel cold.',
  'How did the sun win the challenge?':
    'The sun **shone warmly**, so the traveller felt hot and took off his coat. The sun did not blow or hide, because it won by being gentle and warm.',
  'What is the moral of the story of the wind and the sun?':
    'The story teaches that **gentleness wins where force fails**, just as warmth beat the strong wind. It is not about coats or staying home, because those are only details of the tale.',
  'Which sound word is used for rain in the poem?':
    'The poem uses **pitter-patter** for the sound of rain falling on the roof. Tick-tock is the sound of a clock, so it does not belong to rain.',
  'What protects a squirrel during the storm?':
    'A **big tree** protects the little squirrel, because it hides safe in its branches. An umbrella is held by people, so a squirrel in the story does not use one.',
  'Name two things we use on a rainy day.':
    'On a rainy day we use an **umbrella** and a **raincoat** to keep dry, and boots help too. Saying we use a cap is wrong, because a cap lets the rain through.',
  'How does rain help farmers?':
    'Rain **waters the crops**, so the plants grow big and the farmer gets food. Saying rain spoils the field is wrong, because plants need water to grow at all.',
  'Which is a sound word for falling rain?':
    '**Pitter-patter** copies the sound of rain falling on the roof. \'Umbrella\' names a thing and \'green\' names a colour, so neither one is a sound.',
  'Which of these is NOT a sound word?':
    '**Umbrella** is a thing we hold in the rain, so it is not a sound word. Pitter-patter, drip-drop and splash all copy real sounds, so those three are sound words.',
  'What does rain do to plants?':
    'Rain gives plants water, so it **makes them green** and fresh again. It does not make them dry, because water helps them grow instead.',
  'What happens during a storm?':
    'A storm brings **strong wind, heavy rain and thunder**, which shakes the whole garden. A cool gentle breeze is calm weather, so it is not a storm.',
  'What did the little squirrel do during the storm?':
    'The little squirrel **hid**, and a big tree kept it safe from the wind and rain. It did not play in the rain, because the storm was too strong for that.',
  'How was the garden after the storm?':
    'After the storm the garden was **quiet and fresh**, with every leaf washed clean. It was not hot and dry, because the rain had just watered everything.',
  'What does the story of the storm in the garden teach us?':
    'The storm story teaches that **in hard times we help and protect one another**, just as the tree sheltered the squirrel. It does not say storms are fun, because going out in one is not safe.',
  'What does \'shelter\' mean?':
    '**Shelter** means a place that keeps us safe from rain, wind or danger. A loud sound is only something we hear, so it cannot be a shelter.',
  'Where did the birds go during the storm?':
    'The birds **hid in their nests**, which kept them safe and warm. They did not fly about in the rain, because the strong wind would toss them around.',
  'What should we NOT do at the zoo?':
    'We must **not tease the animals**, because it frightens them and it is unkind. Watching quietly and speaking softly are good manners, so those are things we should do.',
  'Which pair are opposites?':
    '**Loud** and **quiet** are opposites, because they name the two ends of sound. Big and large mean the same thing, so they are not opposites.',
  'Why did Funny Bunny say sorry?':
    'Funny Bunny said sorry because his **jokes made his friends sad**, and then nobody wanted to play with him. He was not sorry for being slow, since speed was never the problem.',
  'Write two rules of good manners at the zoo.':
    'Two good zoo rules are **do not tease or feed the animals** and watch them quietly. Giving them sweets feels kind, but it can make the animals ill.',
  'What is the opposite of \'big\'?':
    'The opposite of big is **small**, because small means little in size. \'Near\' tells us about place, not size, so it is not the opposite of big.',
  'What is the opposite of \'loud\'?':
    'The opposite of loud is **quiet**, because quiet means very little sound. \'Fast\' tells us about speed, so it says nothing about how loud a thing is.',
  'Which pair is a pair of opposites?':
    '**Fast** and **slow** are opposites, because they are the two ends of speed. Fast and quick mean the same thing, so they are not opposites of each other.',
  'What did Funny Bunny like to do?':
    'Funny Bunny liked to **play jokes on his friends**, because he thought it was funny. He did not sleep all day, since he was busy with his tricks.',
  'Why did nobody want to play with Funny Bunny?':
    'Nobody wanted to play with him because his **jokes made his friends sad**. It was not about carrots or being slow, since the story is about hurt feelings.',
  'What did Funny Bunny do to repair the friendship?':
    'He **said sorry and shared his carrots**, and his friends were happy with him again. Laughing even more would have made them sadder, so that could not mend the friendship.',
  'Which rule does the poem give for a visit to the zoo?':
    'The poem says **do not tease or feed the animals**, and keep your voice soft. Giving sweets seems kind, but it can make the animals sick.',
  'What does \'manners\' mean?':
    '**Manners** means polite ways of behaving, like saying please and being gentle. Loud noises are only sounds, so they tell us nothing about manners.',
  'Why should we speak softly at the zoo?':
    'We speak softly so the **animals are not frightened** by loud voices. A zoo is not a library, so that is not the reason we keep quiet there.',
  'When do we say "Good morning"?':
    'We greet people with **Good morning** from the time we wake up until noon, when the day is still young. Saying it in the evening is wrong because by then the sun is going down and we say good evening.',
  'Who finds the magic garden empty?':
    'The garden is full for children who care for it, but **careless** children who pluck flowers find it empty. Thinking of the gardener or the birds is a mistake, because they look after the garden and never empty it.',
  'Write two greetings we use during the day.':
    'During one day we say **good morning** at the start, good afternoon after noon and good evening as the light fades. Saying only goodnight is a mistake, because that greeting belongs to bedtime, not to the day.',
  'What is the moral of "The Magic Garden"?':
    'The magic garden gives its flowers to children who look after it, so **caring for nature** keeps it green and full. Thinking the garden is magic with no work is the mistake, because kindness is what gets rewarded.',
  'What does the poem \'Good Morning\' greet in the morning?':
    'The poem opens the day by greeting the **sky, the sun, the birds and the trees**, all the things we meet in the morning. Greeting the moon and the stars is wrong, because those belong to the night.',
  'When do we say \'Good morning\'?':
    'We say **good morning** from the moment we get up until twelve o\'clock, while the sun is climbing. Saying it only at breakfast is too narrow, because we greet people all morning, not just while eating.',
  'What does a kind greeting do, according to the poem?':
    'The poem says a kind word in the morning makes the **day start well** for us and for the person we greet. Thinking a greeting wastes our time is the opposite, because the poem shows it makes everyone happy.',
  'What does the magic garden give?':
    'The garden shares its **flowers** with children who are gentle and do not tear the plants. Thinking it gives money to the rich is a mistake, because the story is about kindness, not about buying things.',
  'What happens when children pluck flowers without care?':
    'When children pull flowers **carelessly**, the garden has nothing left to show them and looks empty. Believing they get even more flowers is the mistake, because plucking without care takes the beauty away.',
  'What is a garden?':
    'A **garden** is a patch of ground where people grow plants, flowers and vegetables. A place where cars are kept is a garage, so that word does not fit a garden at all.',
  'What is the moral of \'The Magic Garden\'?':
    'The story ends happily for children who **take care of nature**, and their kindness is rewarded with a garden full of flowers. Thinking flowers only cost money misses the point, because the garden gives freely to gentle children.',
  'What does \'pluck\' mean?':
    'To **pluck** means to pull a flower or a fruit off a plant with your fingers. Digging the soil is a different job, so it is not plucking, which is only about picking.',
  'What does \'reward\' mean?':
    'A **reward** is something nice you get because you did something good or helpful. A punishment for a mistake is the opposite, so it can never be a reward.',
  'What do the birds in the poem talk about?':
    'In the poem the two birds sit together and talk about **how people live**, wondering why they hurry and shout. Talking only about food is the mistake, because the birds are curious about our ways, not about their meals.',
  'What did Nina keep near the nest?':
    'Nina put **water and grain** near the nest so the baby sparrows would not go hungry or thirsty. Keeping them in a cage is wrong, because she wanted to help them, not to trap them.',
  'Why did Nina not keep the baby sparrows in a cage?':
    'Nina left the babies free because **wild birds belong in nature**, and their own mother knows how to feed and warm them. Putting them in a cage is the mistake, since a cage takes away the care only a mother bird can give.',
  'What is a stanza?':
    'A **stanza** is a small group of lines in a poem, set apart by a space, like a paragraph in a story. Thinking it is one single line is wrong, because a stanza holds several lines together.',
  'Which word rhymes with \'trees\' in the poem \'Bird Talk\'?':
    '**These** rhymes with trees because both words end with the same -ees sound. Nest does not rhyme with trees, since its ending sound is quite different.',
  'Which word does NOT rhyme with \'say\'?':
    'Day, play and may all end with the same -ay sound, so they rhyme with say. **Trees** ends with -ees instead, so it is the one word that does not rhyme with say.',
  'What did Nina find in her garden?':
    'In her garden Nina found a **nest with baby sparrows** and watched them quietly from a distance. A fish in a pond is a mistake, because this story happens in a nest above the ground.',
  'Why did Nina\'s mother say the birds should stay in the nest?':
    'Mother said the babies should stay because the **mother bird** feeds them and keeps them safe better than anyone else. Thinking the nest was too small is wrong, since the mother\'s care was the real reason.',
  'What is a sparrow?':
    'A **sparrow** is a small brown bird that hops about gardens and chirps all day. A large white bird is not a sparrow, because sparrows are tiny and brown.',
  'How does the story say we should care for wild animals?':
    'The story shows that we help wild animals by giving them **space** and watching from far away. Holding them in our hands is the mistake, because wild creatures feel afraid when we grab them.',
  'What happened to the baby sparrows at the end?':
    'At the end the baby sparrows **grew and flew away** into the sky, as birds are meant to do. Staying in the nest for ever is wrong, because young birds leave once their wings are strong.',
  'How many stanzas does the poem \'Bird Talk\' have?':
    'The poem is printed in **two** groups of lines, one for each bird that speaks. Three or four stanzas would mean more blocks of lines, but this poem has only two.',
  'What does \'observe\' mean in the story of the sparrows?':
    'Nina **observed** the sparrows by sitting still and watching them closely every day. Catching something quickly is the opposite, because observing means looking, not grabbing.',
  'What does the acorn become?':
    'An **acorn** is a tiny seed that slowly grows into a huge oak tree. A river is wrong, because a seed grows into a plant and never into water.',
  'Who pulled the turnip first?':
    'The **farmer** planted the turnip and was the first to pull it, all alone. The mouse was the last helper of all, not the first, so choosing the mouse gets the order wrong.',
  'What does "little by little" mean?':
    '**Little by little** means doing something slowly in small steps until a big job is finished. Believing it happens in one big jump is the mistake, because the poem shows small steps adding up.',
  'What is the moral of "The Enormous Turnip"?':
    'The turnip came out only when everyone pulled **together**, so teamwork does what one person cannot. Believing the farmer could do it alone is the error, because his own pull had already failed.',
  'In the poem, what does the acorn become little by little?':
    'The poem shows the small acorn becoming a tall **oak tree** by growing a little each day. A book cannot grow out of a seed, so that answer does not fit the poem.',
  'What does the stream become little by little?':
    'The tiny stream joins with other water and becomes a wide **river**. A pond is wrong, because a pond holds still water, while the poem shows the water moving and growing.',
  'What does the poem \'Little by Little\' teach us?':
    'The poem teaches that **patience** and small steps every day build big things at last. Believing big things happen in a single day is the mistake, because the poem says they grow slowly.',
  'What did the farmer plant in the story?':
    'The farmer sowed a **turnip** seed that grew into an enormous vegetable. A mango tree is wrong, because the story is about a vegetable that everyone had to pull.',
  'Whom did the farmer call first to help him?':
    'When the farmer could not move the turnip, he first called his **wife** to pull with him. The mouse came last of all, so picking it makes the order of helpers wrong.',
  'What does \'enormous\' mean?':
    '**Enormous** means very big, like the turnip that nobody could pull alone. Very small is the opposite meaning, so it cannot describe that turnip.',
  'How did they finally pull out the turnip?':
    'The turnip came free only when everyone **pulled together** at the same time. Thinking the farmer pulled harder alone is wrong, because his single pull had already failed.',
  'What is the moral of \'The Enormous Turnip\'?':
    'Each new helper added strength until **teamwork** pulled the turnip out of the ground. Saying farmers should work alone is the opposite, because alone he could not do it.',
  'What does \'together\' mean?':
    '**Together** means doing something with other people, side by side. All alone is the opposite idea, because together always needs more than one person.',
  'What does the poem call the sea?':
    'The poem calls the sea a place that can **sing**, with the waves making its music. Calling it a desert is wrong, because a desert is dry sand with no water at all.',
  'Who helps the little fish escape from the net?':
    'A **big fish** pushes the net and helps the little fish slip out to safety. A boat cannot help, because a boat pulls the net up, it does not free the fish.',
  'Name two things you can hear near the sea.':
    'Beside the sea you hear the **waves** rolling in and the gulls calling above your head. A silent place with no sound is the mistake, because the sea is always full of noise.',
  'What is the moral of "A Little Fish Story"?':
    'The little fish is small, yet it is helped and later helps others, so **kindness comes back**. Thinking only big creatures matter is the mistake, because the story shows small ones can help too.',
  'What does the poem \'Sea Song\' do to the sea?':
    'The poet makes the sea speak and sing, so it gives the sea a **voice** like a person. Saying the poem tells us to stay away from water is wrong, because it invites us to listen.',
  'What does \'imagination\' let us do?':
    '**Imagination** lets us picture things in our mind even when they are not in front of us. Seeing things in complete darkness is wrong, because imagination uses our thoughts, not our eyes.',
  'Which sounds does the speaker hear in \'Sea Song\'?':
    'The speaker hears the **waves, the wind and the gulls** making the music of the sea. Drums and flutes belong to a band, not to the shore, so they are not in this poem.',
  'Where did the little fish live?':
    'The little fish lived in a **big pond** crowded with many other fish. Living alone in the open sea is the mistake, because the story shows it among friends in the pond.',
  'What happened to the little fish one day?':
    'One day the little fish was **caught in a net** and could not swim free. Losing its way home is wrong, because the trouble came from the net, not from the path.',
  'Who helped the little fish escape?':
    'A **big fish** helped the little one get out of the net. A turtle never appears in this story, so it cannot be the one who helped.',
  'What does the little fish learn?':
    'After its fright the little fish learns to be **careful** and to help others in trouble. Thinking it should hide in the mud for ever is wrong, because it learns to help, not to hide.',
  'What is the moral of the little fish story?':
    'The story shows that even **small creatures** can help, and the kindness given to the fish comes back. Saying big fish are dangerous is the opposite, because a big fish is the one who saves it.',
  'What does \'escape\' mean?':
    'To **escape** means to get free from something that holds you, like the fish leaving the net. Falling asleep is not escaping, because sleep does not set anybody free.',
  'What colours are the balloons?':
    'The balloon man carries balloons of many colours, like **red, blue, green and yellow**. Only black and white is wrong, because the poem shows bright and happy colours.',
  'Why did the child open the jar?':
    'The child opened the jar to **set the butterfly free**, because it had stopped moving inside. Opening it to give food is wrong, since a trapped butterfly needs air and space, not a meal.',
  'Why do children run after the balloon man?':
    'Children run after him because his **colourful balloons** are lovely and every child wants one. Thinking they run to scare him is wrong, because they run with joy, not with anger.',
  'What is the moral of "The Yellow Butterfly"?':
    'The yellow butterfly grows still inside the jar, so **living things need freedom** to be happy. Keeping it for ever is the mistake, because love means letting it go.',
  'Which word rhymes with \'street\' in the poem \'The Balloon Man\'?':
    '**Sweet** rhymes with street because both end with the same -eet sound. Sky has a different ending, so it does not rhyme with street at all.',
  'What is repetition in a poem?':
    '**Repetition** is saying the same word or line again and again to make it strong in our ears. Reading the poem very fast is different, because speed is not the same as repeating words.',
  'Which word rhymes with \'blue\' in the poem \'The Balloon Man\'?':
    '**Too** rhymes with blue because both words end with the -oo sound. Street ends with -eet, so it does not rhyme with blue.',
  'What did the child do with the yellow butterfly?':
    'The child caught the butterfly in a **net** and put it in a glass jar to keep. Letting it fly at once is wrong, because the child frees it later, after seeing it sit still.',
  'Why did the child feel sad?':
    'The child felt sad because the butterfly **stopped moving** in the jar and looked lifeless. Thinking the jar broke is wrong, since the jar stayed whole and the butterfly was the worry.',
  'What did the child do at the end of the story?':
    'At the end the child **opened the jar** and watched the butterfly fly away happily. Keeping it for ever is the mistake, because that is exactly what had made the child sad.',
  'What does the story of the butterfly teach us?':
    'The story teaches that **living things need freedom**, like the butterfly that moves only when it is free. Thinking jars are good for insects is wrong, because a jar made the butterfly still.',
  'What does \'freedom\' mean?':
    '**Freedom** means being able to move about and live your own way, like the butterfly in the open air. Staying inside the house is the opposite, because freedom needs room to move.',
  'What is a \'bunch\'?':
    'A **bunch** is a group of things held together, like the balloon man\'s bunch of balloons. A single balloon is not a bunch, because a bunch always holds more than one.',
  'Which of these is a command?':
    '**Wake up!** is a command because it orders someone to do something and does not ask a question. \'Could you please wake me?\' is a polite **request**, not an order, so it belongs to a different group.',
  'Why was Neha late for school?':
    'Neha was late because she **stopped the alarm** and went back to sleep instead of getting up. Her bus did come on time, so saying her bus was late misses the real reason.',
  'Write two things you do every morning before school.':
    'Morning things like **brushing your teeth** and eating breakfast happen in the same order every day, which is your routine. Naming one special thing you did only once would not answer a question about every morning.',
  'What did Neha learn from being late?':
    'Neha learnt to be **responsible** for her own mornings: sleep early and get up when the alarm rings. Waiting for her parents to wake her is exactly the habit that made her late.',
  'Which of these sentences is a command?':
    '**Brush your teeth!** is a command because it tells someone to act and ends with an exclamation mark. \'May I have some water?\' asks permission, so it is a **request**, not a command.',
  'How can we make a request sound softer?':
    'Adding **please** and **may I** makes a request sound soft and respectful to the listener. Speaking much more loudly would only make it sound like an order, which is the opposite of soft.',
  'How does a command usually end?':
    'A command usually ends with an **exclamation mark**, as in \'Wake up!\', because the voice rises with the order. A question mark belongs to questions like \'May I come in?\', which are requests.',
  'What did Neha\'s father buy her?':
    'Father bought Neha an **alarm clock** so she could wake up by herself on time. A wrist watch only shows the time and cannot ring, so it could not have solved her problem.',
  'What did Neha do when the alarm clock rang?':
    'When the alarm rang, Neha **stopped it and slept again**, which is why she missed school time. She certainly did not get up at once, so that answer is the opposite of what happened.',
  'How did Neha decide to solve her problem?':
    'Neha decided to **sleep early** and keep the clock away from her bed so she would have to stand up to stop it. A louder clock would not help either, because she would switch that off too.',
  'What does \'responsible\' mean?':
    'Being **responsible** means doing your own duty on your own, like waking up when your alarm rings. Waiting for others to help is the opposite, because then the job depends on them.',
  'What is a \'routine\'?':
    'A **routine** is the set of things we do in the same order every day, such as waking, brushing and eating. An alarm clock is only a tool that helps a routine, not the routine itself.',
  'What did Neha learn from being late for school?':
    'Neha learnt to take **responsibility** for waking up on time instead of blaming others. Staying awake all night would only make her sleepier, so it is no answer at all.',
  'The poem "Noses" is about...':
    'The poem looks at **different shapes of noses** and wonders why one is short and another long. It never talks about smelling flowers, so that answer describes a different poem.',
  'What did the fir tree finally keep?':
    'In the end the fir tree kept its **own green needles**, because they stayed safe through wind and weather. Gold and glass leaves both failed, since thieves stole the gold and the wind broke the glass.',
  'Why were the gold leaves of the fir tree a problem?':
    'The gold leaves shone brightly, but **thieves stole** them in the night and left the tree bare. Rain did not wash them away, because it was people who took them.',
  'What is the moral of "The Little Fir Tree"?':
    'The tree wished for gold and then glass, and lost both, so we should **be careful what you wish for**. Believing that every wish brings happiness is the very mistake the story warns against.',
  'Why does the speaker wonder about the nose in the poem \'Noses\'?':
    'The speaker wonders because the **nose sits right in the middle of the face**, where everyone can see it. It is not tiny or hidden away, so being very small does not explain the wonder.',
  'Which word rhymes with \'nose\'?':
    '**Rose** rhymes with nose because both end with the same -ose sound. \'Face\' ends with a different sound, so it does not rhyme even though a nose is part of a face.',
  'What does an adjective do?':
    'An **adjective** describes a noun, like \'a short nose\' or \'a happy child\'. A word that shows an action is a verb, so that answer names a different part of speech.',
  'Why was the fir tree unhappy?':
    'The fir tree was unhappy because it was **small** and thought its thin needles were ugly. Lack of water was not its problem, since it grew well enough in the forest.',
  'What did the fir tree wish for first?':
    'Its first wish was for **gold leaves**, because gold looked the most beautiful thing to own. Green leaves were what it already had, so that could not have been a wish.',
  'What happened to the glass leaves?':
    'The **wind broke** the glass leaves into small pieces, because glass is hard and brittle. Thieves came for the gold leaves, not the glass, so stealing belongs to the earlier wish.',
  'Why did the gold leaves bring trouble to the fir tree?':
    '**Thieves stole** the gold leaves in the night, so the tree stood bare by morning. Rain cannot wash gold away, so that answer does not match what happened in the story.',
  'How did the fir tree feel at the end of the story?':
    'At the end the tree was **happy with its own needles**, since they stayed green in every season. It was no longer sad about being small, so still feeling unhappy misses the change in it.',
  'What is the moral of \'The Little Fir Tree\'?':
    'The tree lost its gold and glass leaves, so the lesson is to **be careful what you wish for**. Thinking gold is the best thing to own is exactly the wish that brought it trouble.',
  'The poem "Run!" tells us to...':
    'The poem keeps urging us to **be active and move about**, naming run, jump, hop and skip. Sitting quietly all day is the very thing the poem speaks against.',
  'How did Nasruddin become famous as an archer?':
    'Nasruddin shot the arrow first and then **painted the target** around it, so it always looked like a bull\'s eye. He did not practise daily, and that trick is why people wrongly thought he never missed.',
  'Name four movement words from the poem.':
    'The poem is full of **movement words** like run, jump, hop and skip, which all show the body moving. A still word such as sit would not count, because it shows no movement at all.',
  'What does the story of Nasruddin teach us?':
    'The story teaches us not to be **fooled by clever tricks**, because the circle was painted after the shot. Believing a circle always means good aim is exactly how the villagers were tricked.',
  'Why does the poem \'Run!\' repeat the word \'Run\'?':
    'Repeating **Run** again and again gives the poem a fast beat that pushes the reader to move. Filling space to make the poem longer misses the point, since each repeat adds energy, like a drum.',
  'Which word in the poem \'Run!\' rhymes with \'run\'?':
    '**Sun** rhymes with run because both end with the -un sound. \'Road\' and \'grass\' appear in the poem too, but they end with other sounds, so they do not rhyme.',
  'Where does the poem ask us to run?':
    'The poem asks us to run **in the sun and in the rain**, so no weather should stop us. Running only inside the school misses the point that we should move about everywhere.',
  'What did Nasruddin shoot at?':
    'Nasruddin shot his arrow at a **tree** and then drew the circle around the arrow. Shooting at a proper target board would have shown real skill, which is exactly what he lacked.',
  'What did Nasruddin do after shooting the arrow?':
    'After the arrow hit, he **painted a circle around it** so the arrow looked perfectly centred. Shooting a second arrow would have shown his poor aim instead of hiding it.',
  'Why did people think Nasruddin was a great archer?':
    'People saw the arrow **in the middle of a circle** and believed he was a great archer. They forgot that he painted the circle afterwards, so a very fine bow was not the reason.',
  'What does the story of Nasruddin make fun of?':
    'The story makes fun of **people who are fooled by appearances**, since the circle was drawn after the shot. Honest archers who practise daily are not being laughed at here at all.',
  'What does \'wit\' mean?':
    'In the story, **wit** is the quick, clever thinking Nasruddin used when he painted the circle after shooting. A loud voice or great strength belongs to the body, so neither of those is wit.',
  'What is the moral of Nasruddin\'s story?':
    'The moral is to **think for yourself** instead of trusting a clever trick, because the circle was painted later. Believing exactly what you see is the mistake of the villagers, who never asked how it got there.',
  'Which word asks for a reason?':
    '**Why** asks for a reason, as in \'Why is the sky blue?\'. \'Where\' asks about a place and \'When\' asks about a time, so neither of them asks for a reason.',
  'What did Alice follow into the rabbit hole?':
    'Alice followed a **white rabbit with a watch**, and she fell down its hole while chasing it. A cat or a bird would not carry a watch, so that detail points to the rabbit.',
  'Write two "why" questions of your own.':
    'A **why** question always asks for a reason, so \'Why is the sky blue?\' and \'Why do birds sing?\' both fit. A question starting with \'When\' or \'Where\' asks about time or place, not a reason.',
  'What is the moral of the Alice in Wonderland story?':
    'Alice\'s **imagination** takes her to a world of talking animals, and her courage helps her explore it. Believing imagination only makes us afraid is the opposite of what the story shows.',
  'What kind of poem is \'Why?\'?':
    'The poem is a **list of a child\'s questions**, one after another, each asking why. A poem about noses would be \'Noses\', so that answer names a different poem.',
  'What does the poem say curiosity is?':
    'The poem calls curiosity the **beginning of learning**, because every question starts a new discovery. Calling it a waste of time is wrong, since asking is how we find out about the world.',
  'Which question word asks for a reason?':
    '**Why** asks for a reason, as in \'Why do stars shine?\'. \'Which\' asks us to choose one thing from a group, so it never asks for a reason.',
  'Whom did Alice follow in the story?':
    'Alice followed the **white rabbit with a watch** because it seemed to be in a great hurry. A butterfly or a fish has no pocket and no watch, so it cannot be the one she chased.',
  'Where did Alice fall?':
    'Alice fell **down a rabbit hole** and landed in the strange world of Wonderland. A garden well is a different place, so it does not match what happened in the story.',
  'Whom did Alice meet in Wonderland?':
    'In Wonderland Alice met the **Cheshire Cat and the Mad Hatter**, among other strange characters. The fir tree and the sparrow belong to other chapters, so they are not in this story.',
  'How does Alice behave in the strange world of Wonderland?':
    'Alice stays **brave and polite** even when everything around her is strange and puzzling. Being afraid and silent would have stopped her from exploring, so that is not how she behaves.',
  'What does the story say imagination does?':
    'The story says imagination **opens new worlds**, which is exactly what the rabbit hole does for Alice. Saying it stops us from learning is the opposite, because it starts every question.',
  'What is a \'wonderland\'?':
    'A **wonderland** is an imaginary land of wonders, where rabbits carry watches and cats vanish. A real country on a map cannot be one, because a wonderland exists only in imagination.',
  'According to the poem, the dark is...':
    'The poem describes the dark as **quiet and calm**, a time when the whole world settles down to rest. Calling it full of monsters is the fear the poem is trying to take away.',
  'Which word did Helen Keller first understand?':
    'The first word Helen understood was **water**, when Anne spelled it into her hand at the pump. A word like \'mother\' came later, so it was not the one that opened the door for her.',
  'Name two ways to feel brave in the dark.':
    'A small **light** and slow steady breathing both help the body feel safe in the dark. Believing the dark itself is dangerous only makes the fear stronger, which is the habit to break.',
  'Who was Helen Keller and who helped her learn?':
    'Helen Keller was a girl who could not **see or hear**, and her teacher **Anne Sullivan** taught her words. Her mother loved her dearly but could not teach her language, so the teacher is the answer.',
  'What does the poem say about the dark?':
    'The poem says the dark is **quiet and calm**, a peaceful time and not a dangerous one. Thinking it hides danger is our own fear speaking, since the poem finds nothing harmful there.',
  'What shines at night in the poem?':
    'At night the **moon and stars** shine, and the poem points to them as the gentle light of the dark. Street lamps belong to a busy city, not to this calm night scene.',
  'What does the poem call the dark?':
    'The poem calls the dark **a friend that helps us rest**, because it brings quiet after a busy day. Calling it an enemy is the fear the poem asks children to let go of.',
  'What could Helen Keller not do after her illness?':
    'After her illness Helen could not **see or hear**, so she lived in a silent and dark world. She could still walk and run about, so that answer does not fit her at all.',
  'Who taught Helen Keller words?':
    '**Anne Sullivan** was the teacher who spelled words into Helen\'s hand every single day. A doctor treated her illness but did not teach her, so the doctor is not the answer.',
  'What was the first word Helen understood?':
    'Helen understood **water** first, when the cool stream ran over her hand as Anne spelled it. \'Doll\' was a toy she held, but that word did not click for her then.',
  'How did Anne Sullivan teach Helen words?':
    'Anne taught by **spelling letters into Helen\'s hand** with her fingers, so Helen could feel each word. Speaking very loudly could not help, because Helen could not hear anything at all.',
  'What did Helen Keller learn to do?':
    'Helen learnt to **read, write and speak**, and she even went to college later on. Learning only to write her own name would have been a tiny start, not what she achieved.',
  'What is the moral of Helen Keller\'s story?':
    'Helen\'s **courage** and Anne\'s patience turned a silent, dark life into one full of words. Saying teachers are not needed is wrong, because without Anne she could not have learnt.',
  'What is Papa searching for everywhere in the poem?':
    'Papa hunts for the **spectacles** he wears to see, turning out his pockets and peering under the chair because nothing else is missing. A child may pick his newspaper, yet the paper is only what Papa wants to read once he can see again.',
  'Which of these words is spelt correctly?':
    '**Spectacles** keeps the letters in order, with the t before the a and a single l near the end. \'Spectacels\' simply swaps the last two letters, and \'spektacles\' wrongly replaces the c with a k.',
  'The poem calls the spectacles \'his only pair\'. What does the word \'pair\' tell us about the spectacles?':
    'It tells us the spectacles have **two lenses** fixed in one frame and are counted together as a single set, the way we say a pair of shoes. The trap is to think \'pair\' means two separate owners or two loose glasses, when it names one object made of two parts.',
  'Choose the correct preposition: Papa kept his spectacles ______ his pocket.':
    'A pocket is a closed space, so something kept inside it takes **in**, the preposition of enclosure. \'On\' would put the spectacles flat on top of the cloth, and \'above\' would leave them floating in the air.',
  'Where does Papa look for his spectacles in the poem?':
    'Papa\'s search runs through his **pockets**, then under the chair and near the window, which is why the hunt takes so long. Picking the kitchen and the garden mixes in places the poem never mentions, so the answer must stay with the spots actually named.',
  'Where were the spectacles all the time?':
    'The whole time they sat **on Papa\'s head**, resting where he had pushed them up himself. Choosing his pocket copies where he first looks instead of where the search finally ends.',
  'Why is the poem funny?':
    'The joke works because Papa searches his **pockets** and the floor while the spectacles sit on top of his own head, so the answer was with him all along. Choosing that he loses his shoes instead changes the story, since only one thing goes missing.',
  'Which word means \'two things that belong together\'?':
    '**Pair** is the word for two matching things used as one, like a pair of socks or a pair of spectacles. \'Pare\' sounds the same but means to peel, so it names an action rather than a twosome.',
  '\'I ate a ___ with my lunch.\' Which word completes the sentence?':
    'A lunch is eaten, so the fruit **pear** fits the sentence as the thing you bite into. The sound-alike \'pair\' counts two objects and \'pier\' means a landing place by water, so neither can be swallowed.',
  'Which pair of words sounds alike but has different meanings?':
    '**Pair** and **pear** share one sound yet mean a twosome and a fruit, which is exactly what a homophone is. Pair and pocket are simply two unrelated nouns, and glass and glance only start alike.',
  'What does \'spectacles\' mean?':
    '**Spectacles** are the glasses Papa wears so his eyes can read small print clearly. The wrong choices borrow other objects from the poem, like the newspaper or the chair, but none of them sits on the nose.',
  'Why do we say \'a pair of spectacles\'?':
    'Two lenses are joined in one frame and work as a single set, which is why English counts them as a **pair**. It is not about being sold in twos or worn twice, since one frame is bought and worn once.',
  'What could Papa not do without his spectacles?':
    'Without the glasses Papa cannot make out the small print, so **reading the newspaper** is what he loses. Walking, eating and opening a door need no lenses, and choosing one of them confuses seeing with moving.',
  'Who finally spots the spectacles?':
    '**His child** is the one who looks up and sees the glasses perched on Papa\'s head. Papa cannot find them himself and his wife is not the one who points, so the credit goes to the youngest pair of eyes.',
  'Which spelling is correct?':
    'The correct spelling is **spectacles**, with the t before the a and a single l near the end. \'Specatcles\' swaps those two letters, and \'spectecals\' turns the second a into an e.',
  'Which spelling of the word for a daily paper is correct?':
    '**Newspaper** is written as one word with a single p, because the two parts news and paper are joined tightly. The form with a gap makes two separate words, and \'nuespaper\' drops the s.',
  'The spectacles were ___ Papa\'s head.':
    'Something resting on top of a surface takes **on**, and the spectacles sit up on Papa\'s head. \'Under\' reverses the picture and \'between\' needs two things, so neither shows contact with the top.',
  'Papa glanced ___ his chair.':
    'Papa bends his eyes down to the floor beneath the seat, so **under** the chair is where he looks. \'On\' would mean looking at the seat itself, and \'among\' needs several objects grouped together.',
  'What did Gopi hear while he was sitting in the veranda?':
    'Gopi hears something **rustling past** him and then a thud as it lands in the garden, which is what pulls him off the veranda. A horn or his mother\'s voice would be a call to him, and the story gives neither.',
  'Why did Gopi say that the ball could not be Manoj\'s?':
    'Manoj\'s ball disappeared **four months earlier**, so a ball landing today cannot be the same one. The wrong choices invent details about a new football or a bat, but nothing in the story says Manoj replaced it.',
  'In the story, what does the word \'dribble\' mean?':
    'In hockey, to **dribble** is to nudge the ball forward with many small taps of the stick instead of one big hit. Water dripping from a tap is the everyday sense of the same word, so the game meaning must not be confused with it.',
  'Which sentence contains an adverb of frequency?':
    '**Regularly** tells how often the friends gathered, which is the job of an adverb of frequency. \'Immediately\' and \'yesterday\' answer when, and \'now\' also points at time rather than at how often.',
  'Which word tells us WHEN something happened?':
    '**Yesterday** places the action on the day before today, so it is an adverb of time. \'Slowly\', \'quietly\' and \'carefully\' all describe how the action was done, not when.',
  '\'Gopi searched the garden ___ the afternoon.\' Which adverb of time fits?':
    'A stretch of time such as the afternoon takes **in**, as in in the morning or in the afternoon. \'Loudly\' and \'neatly\' describe how something is done, so they cannot fill a slot that needs a time word.',
  'Which of these is an adverb of time?':
    '**Soon** tells when something will happen, so it works as an adverb of time. \'Gently\', \'loudly\' and \'brightly\' all describe the manner of an action, which makes them adverbs of manner.',
  'Which joining word adds information?':
    '**And** joins two ideas by adding one to the other, as in bread and butter. \'But\' turns the second idea against the first and \'or\' offers a choice instead of an extra fact.',
  '\'The ball was new, ___ nobody claimed it.\' Which joining word fits best?':
    'The two halves pull in opposite ways, since a new ball should be claimed, so **but** signals that surprise. \'And\' would flatten the contrast into a plain list and \'because\' would claim the new ball caused the silence.',
  'What does the joining word \'but\' show?':
    '**But** signals a contrast, setting one idea against another as in new but unclaimed. \'And\' is the word for addition, so picking it swaps a turn in meaning for a simple extra fact.',
  'What sound does Gopi hear in the garden?':
    'Something **rustles past** Gopi and lands with a thud, and that double sound is what sends him into the garden. Birdsong or a bell would be steady and expected, while this noise is sudden and unexplained.',
  'What had actually fallen into the garden?':
    'The object that thudded down was a **hockey ball**, the same kind the boys used in their games. A mango falls silently and a bat is far too flat to rustle through leaves.',
  'Why does Manoj say the ball is not his?':
    'Manoj\'s own ball went missing **four months ago**, so he cannot believe a fresh one is his. He does play hockey, so his doubt is about timing, not about being unable to recognise the ball.',
  'What does Gopi decide to do with the ball?':
    'Gopi chooses to **ask around** so the ball can go back to whoever lost it, which shows he is honest. Keeping or selling it would mean treating a found object as his own property.',
  'What does \'boasts\' mean in the story?':
    'To **boast** is to talk about yourself or your deeds with pride, often more loudly than the facts deserve. Whispering or complaining would be the opposite tone, since a boast is meant to be heard.',
  'What does \'dribbles\' mean in the game?':
    'In hockey, **dribbling** means pushing the ball along in short taps so it stays close to the stick. Water dripping is a different sense of the same word, so the sporting meaning must be chosen here.',
  'Which is an adverb of frequency?':
    '**Always** says how often something happens, here meaning every single time. \'Quickly\' tells how, \'yesterday\' tells when and \'here\' tells where, so none of them counts frequency.',
  'Which sentence uses an adverb of frequency?':
    '**Often** states how frequently Gopi plays, which is exactly what an adverb of frequency does. \'Well\' describes how he plays and \'outside\' tells where, so neither one measures how often.',
  'In the poem, what sails across the sky?':
    '**Clouds** are the sailors of the sky in the poem, drifting across and looking lovelier than any boat. Ships stay on the seas and a bridge cannot move, so only the clouds take the sky as their water.',
  'Which pair of words from the poem rhymes?':
    '**Seas** and **these** end with the same sound, so they rhyme at the close of the first stanza. Sky and trees barely share a vowel, and road and heaven end quite differently, which is why neither pair chimes.',
  'Why does the poet call the rainbow a bridge?':
    'Because the rainbow arches overhead, **rises above the trees** and builds a road from the earth to the sky, joining the two ends like a bridge. A real bridge carries people over water, so the poet borrows only its shape.',
  'Which of these words is NOT a compound word?':
    '**Bridge** is a single word that cannot be split into two smaller words with their own meanings. Rainbow joins rain and bow, teacup joins tea and cup and notebook joins note and book, so all three are compounds.',
  'In \'the bow that bridges heaven\', which word is used as a verb?':
    'The word **bridges** carries the action here, meaning joins heaven to earth the way a bridge does. Bow is the noun being described and heaven is only the place it reaches, so neither of them does the joining.',
  'Which word can be used both as a noun and as a verb?':
    '**Sail** names the cloth on a boat and also the act of travelling by wind, so it works as both noun and verb. Tree and sky only name things, and pretty describes rather than names or acts.',
  'In \'boats sail on the rivers\', what is the word \'sail\' doing?':
    'Here **sail** tells what the boats do, so it is the verb of the sentence. Reading it as a noun would mean the boats own a piece of cloth, which the sentence does not say.',
  'What is \'the bow that bridges heaven\' in the poem?':
    'The bow is the **rainbow**, curved like an archer\'s bow and arching from earth up to heaven. A wooden bridge sits over water, and the poem clearly says this bow overtops the trees.',
  'What does the rainbow do, according to the poem?':
    'The poem says the bow **builds a road** from earth to sky, which is how it links the two. Rain and sunshine make a rainbow, but the poem never says it brings rain or hides the sun.',
  'What does \'overtops\' mean?':
    'To **overtop** something is to rise higher than it, and the rainbow overtops the trees. Falling below turns the meaning upside down, since the word is about being above, not beneath.',
  'In stanza one, what sails on the rivers?':
    'The first stanza opens with **boats** on the rivers, paired with ships on the seas. Clouds sail only in the sky, so putting them on the river moves them out of their place in the poem.',
  'What does the poet say is prettier than boats and ships?':
    'The poet finds the **clouds** drifting overhead lovelier than any boat or ship below. Bridges and trees belong to the later stanza about things on land, not to this first comparison.',
  'What does the rainbow bridge, according to the poem?':
    'The bow **bridges heaven**, reaching from the ground up to the sky, so it joins the two. Two rivers or two mountains would need an ordinary bridge lying flat, not an arch in the air.',
  'What does the rainbow build, in the poem?':
    'The rainbow **builds a road** from earth to sky, a path no one can walk but everyone can see. A wall or a river would block the way instead of joining the two ends.',
  'Which pair rhymes in the poem?':
    '**Seas** and **these** rhyme because both end in the same long e sound. Bow and road do not match, and boats and clouds share a stanza but not a sound.',
  'Which word rhymes with \'trees\'?':
    '**Please** ends with the same long e sound as trees, so the two words rhyme. Sky finishes on a different vowel and bow ends in an oh sound, so neither can rhyme with trees.',
  'Which is a compound word?':
    '**Rainbow** is built from two complete words, rain and bow, pushed together. Bridge and colour are single words that cannot be split this way, and pretty is only a describing word.',
  'Which word joins two complete words?':
    '**Seashore** is made of sea and shore, two words that each stand alone and keep their meaning. Sailing only adds an ending to sail, prettier adds a comparison ending and above cannot be split at all.',
  'Why did the merchant keep the parrot in a cage of gold?':
    'The merchant loved the parrot so much that he could not bear to part with it, so he put it in a rich cage of **gold** instead of letting it go. Thinking he wanted the bird to guard his gold confuses a pretty pet cage with a watchman\'s job, since the parrot was never a guard.',
  'How did the parrot get out of its cage?':
    'The parrot lay still as if **dead**, so the merchant lifted it onto the windowsill, and there it stretched its wings and flew away. Believing it broke the bars with its beak misses the trick, because a small bird cannot bend a golden cage and cleverness did the work.',
  'What message did the parrot ask the merchant to give its friends in the jungle?':
    'The caged parrot asked the merchant to carry its **greetings** to the parrots of the jungle, so they would know it still remembered them. The usual slip is to imagine a long letter, but a bird cannot write, so only a spoken message could travel.',
  'Choose the correct collective noun: The merchant saw a ______ of parrots in the forest.':
    'A group of parrots seen together is called a **flight**, a word borrowed from the way birds move through the air. A **herd** belongs to cattle or elephants and a pack to wolves, so those words describe the wrong animals entirely.',
  'What did the caged parrot ask the merchant to bring?':
    'The parrot asked for something no shop sells, the **joy of flying** in the open sky, because freedom was the one thing its golden cage could not give. Asking for a bigger cage or sweeter fruit assumes the bird wanted comfort, when it really longed to be free.',
  'What did the parrot in the forest do when it heard the greeting?':
    'The free parrot listened to the greeting, then dropped to the ground **like a stone**, which looked like death but was really a lesson. Reading it as flying away or singing a happy song turns a clever signal into ordinary bird behaviour and loses the message.',
  'How did the caged parrot finally escape?':
    'Following its friend\'s example, the caged parrot pretended to be **dead**, and once it was set on the windowsill it flew to freedom. Believing the merchant kindly opened the cage reverses the story, since he only moved the bird out because he thought it had died.',
  'Which sentence is in the present perfect tense?':
    '"Has returned" joins **has** with a past participle, which is exactly how the present perfect is built for an action whose result still matters now. "Returned yesterday" is simple past, marked by a finished time word, so it cannot be present perfect.',
  'Which helping verbs are used in the present perfect tense?':
    'The present perfect always uses **has** or **have** before a past participle, as in "the merchant has returned". Is and are build the continuous tense, so they describe something happening right now rather than something just completed.',
  '\'The parrot ___ from its perch.\' Which form completes the present perfect tense?':
    'After the helping verb has, the main verb must be a past participle, and **fallen** is the participle of fall, giving "has fallen". "Fell" is already the simple past and needs no helper, which is why it cannot sit after has.',
  'Where did the merchant keep the parrot?':
    'The story tells us the merchant kept the parrot in a **cage of gold**, which shows both his wealth and his fondness for the bird. Remembering a ship or a garden mixes in other tales, because this parrot stayed inside the house until the day it escaped.',
  'What did the parrot long for?':
    'Behind the golden bars the parrot longed for the **open sky** and the green trees it had lost. Wishing for more food or a bigger cage treats the bird as a pet wanting comfort, when what it actually wanted was freedom.',
  'What did the parrot ask the merchant to carry to the jungle?':
    'It asked the merchant to carry its **greetings** to its friends in the jungle, a message of memory rather than of things. Sending a letter or some fruit forgets that the parrot could only speak, so words were all it had to send.',
  'What did the free parrot do when it heard the greeting?':
    'The free parrot answered the greeting by falling to the ground **as if dead**, teaching the caged bird a trick without a single word. Thinking it attacked the merchant or sang a song ignores the purpose of the fall, which was a silent lesson.',
  'How did the caged parrot learn to escape?':
    'The caged parrot learned escape from its **friend** in the jungle, who showed that pretending to be dead could win a bird its freedom. Believing the merchant kindly opened the cage or the bird broke the bars ignores the lesson the whole story is built on.',
  'What is the moral of the story?':
    'The parrot escaped by **wisdom** rather than strength, so the story teaches that a clever plan can open what force cannot. Saying merchants are cruel blames one person and misses the point, since the real power in the tale is the bird\'s quick thinking.',
  'What is a group of parrots called in the story?':
    'The story calls a group of parrots a **flight**, using the word for birds moving on the wing. A pride belongs to lions and a pack to wolves, so those names do not suit birds at all.',
  'A group of birds flying together is called':
    'Birds that fly together form a **flock**, the everyday word for a group of birds in the air or on the ground. A herd is used for cattle and a school for fish, so those words belong to other animals.',
  'Where does the frog in the poem sit and hop about?':
    'The poem places the frog in **ponds**, in the rain and in muddy drains, because it is a water-loving creature. Putting it in deserts or on dry rocks confuses a frog with a lizard, which is the animal that manages where there is hardly any water.',
  'How does the frog catch its food?':
    'The frog catches insects by flicking its long sticky **tongue** out very fast. Catching food with webbed feet confuses swimming with hunting, since the feet push it through water and can never grab a fly.',
  'How do the frog\'s colours help it?':
    'Its green and brown colours match the **plants** around it, so it can hide in grass and leaves and stay safe from animals that hunt it. Assuming the colours keep it warm forgets that hiding, not heat, is what camouflage is for.',
  'Choose the best joining word: Frogs swim easily ______ they have webbed feet.':
    'The webbed feet are the reason the frog swims easily, so the joining word must show cause, and **because** does exactly that. Using "so" turns the sentence around, making swimming the cause of the feet instead of the result.',
  'Which sentence is in the correct word order?':
    'A clear sentence puts the subject first, then the verb, then the rest, and "The frog sits in the pond" follows that **order** perfectly. The jumbled versions scatter the words so the reader cannot tell who is doing what.',
  'Which group of words makes a proper sentence?':
    'This group has a subject, a verb and a complete idea, so it makes a proper **sentence** on its own. The other groups throw the same words down in any order, which reads as nonsense rather than a sentence.',
  'What is the usual order of words in an English sentence?':
    'English sentences normally follow **subject, verb, object**, as in "the frog flicks its tongue". Saying any order is correct ignores the fact that a reader expects the doer first and the action next.',
  'What is a tongue twister?':
    'A tongue twister is a line full of similar sounds that is **hard to say** quickly without slipping. Calling it a poem with very long lines confuses difficulty in speaking with difficulty in reading length.',
  'Why do we practise tongue twisters?':
    'Practising tongue twisters trains the mouth to move quickly and clearly, which improves **pronunciation**. Thinking they help spelling mistakes the point, because the practice is entirely about speaking aloud, not writing letters.',
  'Which of these is a tongue twister?':
    'The repeated s and sh sounds make "She sells sea shells" trip the tongue, and that is what a **tongue twister** does. The plain sentences about a frog or the sun have no repeating sounds, so they stay easy to say fast.',
  'Where does a frog live?':
    'A frog lives **both** on land and in water, which is why it is called an amphibian. Saying only in water forgets the frog that hops on the bank to hunt insects in the grass.',
  'What does the frog eat?':
    'Frogs eat **insects**, catching them with a quick flick of a sticky tongue. Thinking it eats leaves confuses the frog with a caterpillar, which is the animal that chews plants.',
  'Why do the frog\'s colours help it?':
    'The frog\'s colours match the plants around it, so it can **hide** from the animals that would eat it. Saying the colours attract insects is backwards, because then insects would fly towards a hunter instead of away from one.',
  'What must the frog beware of?':
    'The poem warns the frog to beware of **snakes**, which hunt it both in the water and in the grass. Fearing rain or dew is misplaced, since a frog needs water and welcomes the rain.',
  'Which word shows a reason?':
    '**Because** introduces a reason, as in "it hides because its colours match the plants". "But" shows contrast and "and" simply adds, so neither one explains why something happens.',
  '\'The frog is small ___ it jumps high.\' Which word fits best?':
    'Small size and high jumps pull against each other, so the joining word must show contrast, and **but** does that. Using "because" would wrongly claim that being small is the cause of jumping high.',
  'Why does the frog need to be quick with its tongue?':
    'Insects fly off in a moment, so the frog must be quick with its **tongue** to catch them. Saying the tongue is short explains nothing, because a short tongue moves easily and speed is the real need.',
  'A frog\'s life begins as':
    'A frog\'s life begins as an **egg** laid in water, which hatches into a tadpole before it grows into a frog. Starting the story at a tadpole skips the egg stage, and a cocoon belongs to a butterfly, not a frog.',
  'In Tamil Nadu, what are Ooranis used for?':
    'Ooranis are village tanks that hold **rainwater** so people can drink and farmers can water their fields. Thinking they store grain confuses a water store with a granary, which is a completely different kind of building.',
  'For how long can a Tanka store enough water?':
    'A Tanka is dug deep enough to hold water through the long dry spell, so it lasts **six to seven months**. Reading it as six to seven days ignores the desert, where a tank must carry a village across a whole season.',
  'How do the shapes of Punjab\'s water tanks reflect the people who own them?':
    'Each Punjab tank is shaped to match its owner, so a farmer\'s tank may look like a **tractor**, a bullock cart or a rooster. Assuming the shape stores more water gets the purpose wrong, since the shape is a personal sign and not a plan for capacity.',
  'Which sentence uses the correct contracted form?':
    'The apostrophe replaces the missing o in "is not", so it sits between the n and the t, giving **isn\'t**. Writing "isnt" drops the apostrophe and "i\'snt" puts it in the wrong place, so both lose the mark that makes the contraction.',
  'What are \'Tankas\' in the Thar region of Rajasthan?':
    'In the Thar desert, **Tankas** are underground tanks that keep rainwater for six to seven months. Calling them open wells or canals ignores that desert people cover and bury them so the sun cannot drink the water first.',
  'What are tanks kept or built on roofs called?':
    'A tank fixed on a roof is called an **overhead** tank, because it sits above the rooms of the house. Calling it underground reverses its position, and ooranis are village ponds rather than roof tanks.',
  'What is special about the water tanks of rural Punjab?':
    'Rural Punjab tanks are built in striking **designs** such as a flower, an aeroplane or a football, each chosen by the owner. Saying they are always underground is wrong, because these decorated tanks stand in the open where everyone can see them.',
  'Which of these sentences is exclamatory?':
    '"What a tank!" bursts out with strong feeling, so it is **exclamatory**. "Is the tank full?" asks a question and "Fill the tank" gives an order, so neither of them shows excitement.',
  'Which punctuation mark ends an exclamatory sentence?':
    'An exclamatory sentence ends with an **exclamation mark**, which signals strong feeling the way a raised voice would. A full stop ends a calm statement, so it flattens the excitement the sentence carries.',
  'Which sentence shows strong feeling?':
    'The words "How beautiful" pour out delight, so that line shows strong **feeling**. "The rainbow has seven colours" only states a fact, which is a plain statement with no emotion in it.',
  'What are \'Ooranis\' in Tamil Nadu?':
    'An **Oorani** is a Tamil Nadu tank built to catch and store rainwater for the whole village. Calling it a waterfall mistakes a still store of water for falling water, which is the opposite of what a tank does.',
  'What is special about Panam Keni wells in Kerala?':
    'The **Panam Keni** wells of Kerala are famous for never drying up, even in the hottest months of the year. Saying they store sea water confuses their deep supply of fresh water with the salty sea nearby.',
  'What are Tankas?':
    'A **Tanka** is an underground tank found in Rajasthan\'s Thar region, built to save rainwater from being lost. Placing them in Tamil Nadu or Kerala swaps the regions, and a canal carries water along rather than storing it.',
  'How long can a Tanka store enough water for?':
    'Its deep, covered **storage** keeps the water usable for six to seven months, long enough to cross the dry season. One week or one day would not help a desert village at all through the months without rain.',
  'Why are Punjab\'s tanks built in unusual shapes?':
    'In Punjab the **shape** of a tank announces its owner, so a football fan builds a tank like a football. Saying the law requires it invents a rule that is not in the text, and round shapes are no cheaper than others.',
  'Which shape is mentioned for a Punjab tank?':
    'The text describes a tank shaped like a **giant flower**, standing in a field as decoration and as a sign of its owner. A long boat or a small hut is not one of the shapes given, so those answers come from guessing.',
  'What is the contraction of \'do not\'?':
    'The apostrophe takes the place of the missing o, giving **don\'t** with the mark sitting between the n and the t. Writing "dont" leaves the apostrophe out, and "do\'nt" puts it in the wrong spot.',
  'What is the contraction of \'they are\'?':
    '"They are" squeezes into **they\'re**, with the apostrophe standing in for the dropped a. "Their" and "there" sound the same but mean possession and place, so they are entirely different words.',
  'Which two things are needed to play Gilli Danda?':
    'The game needs just two wooden pieces: a long stick called the **danda** to strike with and a small pointed stick called the **gilli** to be hit. A ball and a bat belong to cricket, so players who picture rounders or cricket mix up the equipment.',
  'How do the players feel while playing Gilli Danda, according to the poem?':
    'The poem shows the players laughing, shouting and running about freely, so the mood is **happy and free** rather than tense. Thinking the game is about winning at any cost is the mistake, because nobody in the poem is worried about losing.',
  'What do the prefixes \'un-\' and \'re-\' mean? Give one example of each.':
    '\'Un-\' means **not**, so \'unhappy\' means not happy, while \'re-\' means **again**, so \'rewrite\' means to write once more. A learner who thinks \'re-\' means \'before\' is confusing it with the \'pre-\' in words like \'preview\'.',
  'Which of these words is an abstract noun?':
    '**Happiness** is a feeling you cannot see or touch, so it is an abstract noun. Football, spoon and mountain are all concrete things you can hold or visit, which is why they do not fit.',
  'Which word is a possessive pronoun?':
    '**Mine** stands alone and shows who owns something, so it is a possessive pronoun. \'My\' looks similar but must sit before a noun, as in \'my ball\', so it is a possessive adjective instead.',
  '\'This ball is ___.\' Which possessive pronoun completes the sentence?':
    'The blank comes after \'is\' with no noun following it, so the possessive pronoun **mine** fits. Choosing \'my\' fails here because \'my\' needs a noun straight after it, as in \'my ball\'.',
  'Which sentence uses a possessive pronoun correctly?':
    '**Ours** is a possessive pronoun that can stand alone at the end of a sentence. \'Our\', \'we\' and \'us\' cannot do that job, because \'our\' needs a noun after it and \'we\' and \'us\' are subject and object forms.',
  'Which question word asks about a place?':
    '**Where** asks about a place, as in \'Where do you play?\'. \'Who\' asks about a person, \'why\' asks about a reason and \'when\' asks about time, so each one points at a different kind of answer.',
  '\'___ do we play gilli danda?\' Which question word asks about place?':
    'The answer would be a place such as the playground, so the question word is **Where**. Starting with \'When\' would ask about time and \'Why\' about a reason, which the sentence does not want.',
  'Which sentence is a correctly formed question?':
    'After \'did\' the verb must stay in its base form, giving **\'Where did you keep the gilli?\'**. Writing \'did you kept\' doubles the past tense, and \'Where you kept\' leaves out the helping verb that English questions need.',
  'What are the two sticks used in gilli danda?':
    'The **danda** is the long stick the player holds and the **gilli** is the short one that gets struck. A bat and ball or a rope and peg belong to other games, so they are not part of this one.',
  'What is the game called in English?':
    'English speakers call this two-stick game **tip-cat**, because the small stick is tipped into the air before it is hit. Rounders, kabaddi and hopscotch are different games with their own rules and equipment.',
  'How do the players feel in the poem?':
    'The poem repeats that the players are **free and happy**, laughing as they run about. Feeling tired, bored or angry belongs to games played under pressure, which is the opposite of the mood shown.',
  'What does \'our game is so sound\' mean?':
    'Here \'sound\' means healthy and good, so the line says the game is **good and enjoyable**. Reading \'sound\' as noise is the trap, because the poet is praising the game, not describing its volume.',
  'What does the prefix \'un-\' mean in \'unhappy\'?':
    'The prefix **un-** flips a word to its opposite, so \'unhappy\' means \'not happy\'. \'Re-\' means again and \'pre-\' means before, so those prefixes would give a completely different meaning.',
  'What does the prefix \'re-\' mean in \'replay\'?':
    '**Re-** means \'again\', so to replay is to play once more. \'Un-\' would mean not, and \'under\' is a separate word rather than a prefix that adds the idea of repeating.',
  'Which word is an abstract noun?':
    '**Happiness** names a feeling, which has no shape and cannot be touched. Gilli, playground and stick are all things you can see and hold, so they are concrete nouns.',
  'An abstract noun names':
    'An abstract noun names something invisible like a **feeling or idea**, such as courage or kindness. A place or a thing you can touch is concrete, so those choices describe the other kind of noun.',
  'Why did the farmer buy the well?':
    'The farmer\'s fields needed water, so buying the **well** gave him a supply for irrigation. He was not buying to resell at a profit or to block his neighbour, since the trouble only started afterwards.',
  'What did the Panchayat finally decide?':
    'The Panchayat turned the neighbour\'s own claim against him, ruling that if the water was still his he must **remove it at once**. Filling the well with mud would have destroyed the farmer\'s property, so that was never the judgment.',
  'What does \'adamant\' mean in the story?':
    'Being **adamant** means refusing to change your mind, which is exactly how the neighbour behaves when he ignores everyone\'s advice. A person who is only quiet or shy is not adamant, because the word is about stubbornness.',
  'What does the word \'careless\' mean?':
    'The suffix **-less** means \'without\', so careless means doing something without care or attention. \'Full of care\' would be \'careful\', which is the opposite meaning built from the same root word.',
  '\'The members gathered ___ the banyan tree.\' Which preposition fits?':
    'People sit in the shade beneath a banyan tree, so **under** is the natural preposition. \'Above\' and \'over\' would put the members up in the branches, and \'across\' suggests crossing the tree rather than resting below it.',
  'Which of these words is a preposition?':
    '**Among** shows the relation of one thing to a group, so it is a preposition. \'Gather\' is an action verb, while \'village\' and \'wisdom\' are nouns naming a place and a quality.',
  '\'The farmer stood ___ the well.\' Which preposition shows position next to it?':
    '**Beside** means at the side of something, which fits a person standing next to a well. \'Between\' needs two things, \'above\' means higher up and \'through\' means passing inside, so none of them shows position at the side.',
  'What happened first in the story of the Panchayat?':
    'The story opens with the farmer buying a field that already had a **well** in it. Going to the village chief, the Panchayat\'s judgment and any apology all come later, so they cannot be the first event.',
  'What did the cunning neighbour claim?':
    'The neighbour tried to twist the deal by saying he had sold only the **well** and kept the water for himself. Claiming the farmer stole water or that the well was broken would be a different excuse, and neither appears in the story.',
  'What was the Panchayat\'s judgment?':
    'The elders used the neighbour\'s own words, deciding that if the water was his he must **remove it from the well at once**. Filling the well with mud or making the farmer pay would punish the wrong man, so those were not the verdict.',
  'What did the farmer buy from his neighbour?':
    'The purchase was a **well** standing in the field the farmer bought. A field, a house and a bullock are not the thing bought here, even though a field does appear in the story.',
  'What did the neighbour refuse to give the farmer?':
    'The neighbour handed over the well but kept back the **water**, saying it was never part of the sale. He had already taken the money and given the well, so those were not what he refused.',
  'Where did the Panchayat meet?':
    'Village elders traditionally meet in the shade of the **banyan tree**, and that is where this Panchayat sits. A temple, market or school would be a different setting, and the story names the tree.',
  'What did the villagers praise?':
    'The villagers admired the clever, fair judgment, so they praised the **wisdom of the Panchayat**. The farmer\'s field, the neighbour\'s wealth and the size of the well are not what the story says they praised.',
  'What does \'cunning\' mean?':
    '**Cunning** describes someone clever who uses that cleverness to trick others, as the neighbour does. Kindness, strength and wealth are separate qualities, so they do not carry the idea of trickery.',
  'What does \'adamant\' mean?':
    'An **adamant** person will not change their decision however much others argue, which is how the neighbour acts. Being generous or easily frightened is the opposite kind of behaviour, so those choices miss the stubbornness.',
  'What does the suffix \'-less\' mean?':
    'The suffix **-less** means \'without\', so \'careless\' is without care and \'homeless\' is without a home. \'Full of\' would be the suffix \'-ful\', as in \'careful\', which gives the opposite meaning.',
  'What does \'careless\' mean?':
    'Adding **-less** to \'care\' gives careless, meaning doing something without care or attention. \'Full of care\' is \'careful\', the exact opposite, so that choice reverses the meaning of the word.',
  'What does the hawker cry out as he walks in the lane?':
    'The hawker calls **bangles, crystal bangles** to draw customers to the shining glass bangles in his basket. Mangoes, flowers and rotis belong to other sellers, so they do not match this poem\'s hawker.',
  'What does the speaker compare the street lamp to?':
    'The child imagines the lamp as a **giant with one red eye** in its head, standing still and watching the lane. A shadow, a hawker and a gardener are other figures from the poem, but none of them is the lamp.',
  'Why does the speaker wish to be a gardener?':
    'The child wants the gardener\'s freedom: he **digs where he likes** with his spade, gets his clothes dusty and no one scolds him. Wanting the job only for money or plants misses the point, because the poem is about being your own master.',
  'Choose the sentence that is written correctly.':
    'With \'he\' the verb needs -s, so **\'He goes to school every day\'** is correct. \'He go\' and \'My mother are\' break subject-verb agreement, and \'The birds is flying\' uses a singular verb with a plural subject.',
  'What does \'vocation\' mean?':
    'A **vocation** is the work a person does, which is why the poem is about the jobs the child dreams of. A school subject, a home or a holiday is something you study or visit, not the work you do.',
  'In the poem, who does the child wish to be in the morning?':
    'In the morning the child hears the hawker\'s cry in the lane and wishes to be a **hawker**. The gardener comes later in the day and the watchman at night, so neither of them belongs to the morning.',
  'Why does the child wish to be a watchman?':
    'The child envies the watchman because he is **never sent to bed** and can stay awake all night with his lantern. A big house, fine clothes and a lot of money are never given as the reason.',
  'Which question word asks about a person?':
    '**Who** asks about a person, as in \'Who is crying bangles in the lane?\'. \'How\' asks about manner, \'where\' about place and \'when\' about time, so each looks for a different kind of answer.',
  'Which question word asks about the way something is done?':
    '**How** asks about the way or manner of an action, as in \'How does he dig?\'. \'Whose\' asks about ownership, \'who\' about a person and \'which\' about a choice from a set.',
  '\'___ does the hawker cry?\' Which question word asks about the thing he cries?':
    'The missing word stands for the thing being called out, so **What** is right, as in \'What does he cry?\'. \'Who\' would ask about a person, \'when\' about time and \'where\' about place.',
  'What does the hawker cry in the morning?':
    'The hawker walks the lane calling **bangles, crystal bangles** so that people come out to buy them. Fruit, cakes and books are goods sold by other traders, so they do not fit this poem.',
  'Why does the child envy the hawker?':
    'The child is tied to a timetable, while the **hawker has no fixed time** to return home and works at his own pace. A big shop or great wealth is never mentioned, and going to school is what the child does, not the hawker.',
  'What does the gardener do with his spade?':
    'The gardener uses the spade to **dig the ground as he likes**, with nobody telling him where to work. Selling it, giving it away or polishing it are not in the poem, which stresses his freedom to dig.',
  'Why does nobody scold the gardener?':
    'The gardener has **no master** telling him what to do, so no one can scold him for digging or dirtying his clothes. Being the child\'s uncle, being old or working at night are details the poem never gives.',
  'What does the watchman carry?':
    'The watchman carries a **lantern** as he walks up and down the lane all night. A spade belongs to the gardener and a basket to the hawker, so those choices mix up the poem\'s three workers.',
  'What does the street lamp look like to the child?':
    'To the child\'s imagination the lamp is a **giant with one red eye**, standing in the street and staring down the lane. A star, a tree or a boat has none of the lamp\'s height and glow, so that picture would not fit.',
  'Which sentence is correct?':
    'A singular subject takes the verb **walks**, so \'The watchman walks up and down the lane\' is correct. Dropping the helping verb leaves \'The watchman walking\', and \'are\' or \'walk\' do not agree with one watchman.',
  'Which sentence about the gardener is written correctly?':
    'With one gardener as the subject, the verb takes -s, giving **\'The gardener digs the ground every morning\'**. \'Dig\' and \'digging\' break the agreement, and \'have dug\' would need a plural subject.',
  'What is the first step in making glass bangles in Ravi\'s workshop?':
    'Work on a bangle begins at the furnace, where the glass is **heated** until it is soft enough to draw into a round shape. Packing the bangles in boxes comes at the very end, so treating it as the first step puts the finish before the beginning.',
  'Which new designs did Ananya add to the bangles?':
    'Ananya painted **delicate floral patterns and geometric shapes** on the bangles to make an old craft look new. Maps of Firozabad describe the town itself, not a design that can be printed on a bangle.',
  'Why did the special Diwali collection succeed, and how did it help the community?':
    'Customers loved the **new designs and bright colours**, and the rush of festival orders gave local artisans steady work plus jobs in packing and transport. Thinking the collection succeeded only because prices were raised misses how the extra demand reached the whole workshop.',
  'Choose the correct form: By the time the customers arrived, Ravi ______ the new bangles.':
    'Two past events are stacked here, so the earlier one takes **had finished**, the past perfect that marks the work already done before the customers came. Using \'has finished\' pulls a present-tense helper into a story that is fully in the past.',
  'In which state is Firozabad, famous for glass bangles?':
    'Firozabad, the bangle town of the chapter, sits in **Uttar Pradesh**, close to Agra. Rajasthan is a tempting pick because it is famous for crafts, but its well-known crafts are textiles and pottery, not glass bangles.',
  'How is a glass bangle made?':
    'The craft follows one order: the glass is **heated in a furnace, shaped, coloured and cooled** before it can be packed. Glass cannot be woven on a loom like cloth, so that choice mistakes a bangle for a fabric.',
  'Who was Ananya in the story?':
    'Ananya is **Ravi\'s daughter**, the young woman who brings new patterns and colours into the family workshop. Calling her a shopkeeper removes her from the household where the designs are actually drawn and tried.',
  'Which sentence uses capital letters correctly?':
    'Only one sentence opens with a **capital letter** and also keeps the place name Firozabad capitalised. The other versions capitalise every word or write \'ravi\' in small letters, which breaks both rules at once.',
  'What must every sentence begin with?':
    'Every sentence opens with a **capital letter**, which signals to the reader that a new thought is starting. A full stop belongs at the end, so placing it at the start confuses the closing mark with the opening one.',
  'Which sentence is punctuated correctly?':
    'Direct speech needs a **comma before the opening quotation marks**, a capital letter inside them and the full stop before the closing mark. The versions without quotation marks turn Ananya\'s exact words into a loose report, and the one with a small \'i\' forgets the capital.',
  'Where is glass heated to make bangles?':
    'The glass softens in a **furnace**, a very hot oven that makes it workable enough to shape. Water and a freezer are cold, so they would harden the glass instead of softening it.',
  'What happens to the glass after it is shaped?':
    'Once the shape is ready, the bangle is **coloured, decorated and cooled** so the colour sets and the glass turns hard. Breaking it into pieces would destroy the bangle just made, which is the opposite of finishing it.',
  'What new designs did Ananya introduce?':
    'Her sketches carry **floral patterns and geometric shapes**, printed onto bangles that were once plain. Choosing wooden or plastic bangles confuses a new pattern with a new material, yet the workshop still works in glass.',
  'What did Ananya want to do with the traditional craft?':
    'She wanted to **keep the craft true while adding modern ideas**, so the old skill survived with fresh designs on top of it. Replacing the work with machines would end the very handcraft she was trying to save.',
  'Why did demand for bangles rise during Diwali?':
    'Diwali is a festival of lights and gifts, so **people buy bangles** to wear and to give, and orders climb sharply. Cold weather does not make glass cheaper, so that reason explains nothing about the season\'s shopping.',
  'How did the artisans meet the festival demand?':
    'To fill the festival orders the artisans **worked around the clock**, keeping the furnace and the workbenches busy day and night. Closing the workshop would have left those orders unfilled, so it cannot be the way demand was met.',
  'The past perfect tense is made with':
    'The past perfect is built from **had plus the past participle**, as in \'had shaped\' or \'had finished\'. \'Has finished\' uses a present-tense helper and belongs to the present perfect, which cannot point to an earlier past action.',
  'Which sentence shows one past action happening before another?':
    '**Had shaped** marks the shaping as finished before the cooling began, so two past moments are clearly ordered. \'Ravi shaped the bangle and it cooled\' lists the events without showing which one came first.',
  'What did sage Mahipati ask Rama Natha to collect in a bottle?':
    'The sage sent Rama Natha out to gather **dew from banana leaves**, drop by drop, before sunrise. Juice pressed from ripe bananas would need no patience at all, which is exactly the easy shortcut the sage wanted to defeat.',
  'Why did the Raven open his beak?':
    'The Fox praised the Raven\'s voice, so the bird opened his beak to **sing** and the morsel fell to the ground. Wanting to eat the morsel has it backwards, since opening the beak is what made him lose the food.',
  'How did the man and his wife get help from the kotwal?':
    'They kept **calling the name Rama** until the kotwal, whose name was also Rama, heard it and came running to their house. Staying quiet and waiting would have left the thief free to dig his way inside.',
  'Which sentence correctly uses the present progressive tense?':
    '**Is digging** pairs the helping verb \'is\' with the -ing form, which is exactly how the present progressive is built. \'Has dug\' is the present perfect and points to a finished action, not one still going on.',
  'What does the story \'A Bottle of Dew\' teach?':
    'The magic dew turns out to be a trick that keeps Rama Natha working in his field, so the lesson is that **hard work, not magic, brings results**. Reading it as a story about valuable dew mistakes the bottle for the message.',
  'Why does the wise man ask for dew?':
    'The wise man invents an impossible task **to make the lazy man work**, knowing the field would be tended while he chased it. Asking for dew because he was thirsty would need no bottle and no months of patient effort.',
  'How does the fox get the raven\'s food?':
    'The Fox wins the morsel **by flattering the Raven**, praising his feathers and his voice until the bird sings. Climbing the tree is impossible for the Fox, which is why he uses clever words instead of paws.',
  'What is the moral of \'The Raven and the Fox\'?':
    'The Raven loses his food the moment he believes sweet words, so the moral warns us **not to trust flatterers**. Saying that singing is dangerous blames the song rather than the cunning praise that caused the fall.',
  'What quality does Rama show in the story?':
    'Rama steps into difficulty for others, showing **courage and readiness to help**. Calling him lazy or greedy contradicts every choice he makes in the tale.',
  'Why does Rama decide to help?':
    'Rama acts because **someone is in trouble and needs help**, not because of any reward. Waiting for a king\'s order would mean the person in danger is helped far too late.',
  'Which sentence is in the present progressive tense?':
    '**Is singing** shows the action happening right now, formed with \'is\' plus the -ing verb. \'Sang loudly\' is the simple past, so it reports a finished moment instead of one in progress.',
  'The present progressive tense is formed with':
    'The present progressive uses **am, is or are plus the -ing form**, as in \'is singing\'. \'Has or have plus the past participle\' builds the present perfect, which describes a completed action rather than one in progress.',
  'Why did Gajaraj stop eating after Buntee was taken away by the farmer?':
    'Gajaraj refused his food because he was **missing his friend** Buntee, the dog he had shared his days with. Blaming a high fever ignores the sadness the story points to, and no illness is described.',
  'What was special about the chair that Mario\'s grandfather gave him?':
    'The chair was **invisible and could show who his real friends were**, so visitors who could not see it gave themselves away. Calling it merely old misses the magic entirely, since the point is the quiet test it sets.',
  'What does the speaker in A Friend\'s Prayer wish to do for her friends?':
    'She asks to **give her very best** to her friends, to help their wishes come true, to see with her heart what a friend can be and to love them as they are. Wanting wealth and fame for them would turn a prayer of giving into a wish for possessions.',
  'Which pair correctly joins a root word to a suffix to make a real word?':
    '**Friend plus -ship** gives the real word \'friendship\', where the suffix names a relationship. Adding -ful to \'laugh\' looks neat but produces \'laughful\', a word English never uses.',
  'What makes the friendship in the story \'unlikely\'?':
    'The pair is called unlikely because the two friends are **very different from each other**, so nobody expects them to become close. Living far apart is not the point, since the surprise comes from their natures rather than the distance.',
  'What does the story say about friendship?':
    'The story shows friendship **growing between very different people**, because kindness, not sameness, holds them together. Believing friends must be identical would rule out the very pair the story celebrates.',
  'What does the poem ask for a friend?':
    'The prayer asks for **strength, patience and understanding**, the quiet gifts that help a friend through hard days. Asking for wealth and fame would turn a prayer about caring into a demand for things.',
  'What is the tone of \'A Friend\'s Prayer\'?':
    'The voice is **warm and sincere**, speaking gently about love, patience and giving one\'s best. A comic or bitter tone would mock the friend rather than pray for her.',
  'What does the chair in the story represent?':
    'The chair stands for **care and consideration for others**, since it quietly reveals who notices another person\'s comfort. Reading it as a sign of wealth misses the test, because the chair is treasured for something money cannot buy.',
  'Why does the chair matter to the characters?':
    'The chair matters because it is **where someone they love used to sit**, so it holds memory rather than value. A high price or a new finish would mean nothing, since the family treasures the person, not the furniture.',
  'What is the root word in \'friendly\'?':
    'The **root word** carries the meaning before any ending is added, and here that part is \'friend\'. Treating \'-ly\' as the root mistakes a suffix for the base that the suffix attaches to.',
  'Which word is made by adding a suffix to \'care\'?':
    '**Careful** is built from \'care\' plus the suffix -ful, meaning full of care. \'Uncare\' puts a prefix in front of the word instead of a suffix behind it, so it does not fit the rule.',
  'What happens when the powder of neem seeds is mixed in water and sprayed on plants?':
    'Sprayed neem seed powder keeps **locusts away, so they do not eat the plants**, which is why farmers use it instead of harsh chemicals. Expecting the plants to grow taller in a day confuses a pest guard with a fertiliser.',
  'What did the baby bird think the world was made of while it lived in the nest?':
    'From inside the nest the baby bird could see only its own walls, so it decided the world was made of **straw**. A pale blue shell describes the egg it hatched from, not the world it believed in while living in the nest.',
  'How did Daadi use heeng when Vikram and Vaibhavi were babies?':
    'Daadi rubbed **heeng water on their tummies** to ease the gas that made the babies uncomfortable. Giving it as a drink would be a much stronger remedy than the gentle rub she actually used.',
  'Which of these is a hyphenated compound word?':
    '**Thought-provoking** joins two words with a hyphen, which is exactly what a hyphenated compound means. \'Grandmother\' and \'childhood\' are written as single words with no hyphen, and \'neem oil\' stays two separate words.',
  'Why is the neem tree called \'Neem Baba\'?':
    'The tree earns the name Baba because it **protects and heals people like a caring elder**, shading them and curing their ailments. Its bitter taste explains nothing, since the name is about the care it gives rather than its flavour.',
  'Which use of neem is mentioned in the chapter?':
    'The chapter lists **neem leaves and oil used as medicine**, for skin, hair and stomach troubles. Using neem wood for paper is never mentioned, because the tree is valued for its healing parts, not for its pulp.',
  'What is the poem \'What a Bird Thought\' about?':
    'The poem follows **a bird\'s view of the world around it**, which keeps changing as the bird moves from nest to open flight. A hunter\'s story would centre on a person chasing the bird, but here the bird alone is speaking.',
  'Which feeling does the poem create about nature?':
    'Each new view makes the bird and the reader feel **wonder** at how much bigger the world is than it seemed. Fear or boredom would make nature dull and closed, yet the poem keeps opening it up.',
  'Which spice is commonly used to soothe a cough?':
    'Warm milk with **turmeric** is the household remedy for a cough, because turmeric soothes a sore throat. Chilli powder would irritate the throat, so it does the opposite of soothing.',
  'Why are spices described as healing?':
    'Spices are called healing because **many have medicinal properties** that families use at home, long before any clinic. Being colourful or costly says nothing about health, so those traits cannot explain the word.',
  'A compound word is made by joining':
    'A compound word joins **two complete words**, as rain and coat make raincoat. A word plus a prefix or suffix makes a derived word instead, which is the mix-up to avoid.',
  'Which word is a compound word?':
    '**Raincoat** is two whole words, rain and coat, joined into one. \'Rainy\' and \'raining\' are just rain with endings added, so they gain letters rather than a second word.',
  'How did Prabhat win the badminton match against Surya?':
    'Prabhat does not beat Surya on the court at all - he **changes the scoreboard** while Surya is looking elsewhere, so the score pretends he won. The idea that he practised harder mistakes honest effort for cheating, and it hides the fact that Surya was the stronger player.',
  'From which Sanskrit root does the word Yoga come?':
    'Yoga comes from the Sanskrit root **Yuj**, which means to join or unite, and that is why yoga is described as joining body and mind. Choosing Asana confuses the word for a seated posture with the name of the whole practice.',
  'What happens in the poem when blue dark turns to black?':
    'As the blue dark deepens to black, the grass turns **cold** under the children\'s feet, the trees seem to creep close, the game ends and night wins. A common slip is to read the ending as morning arriving, when the darkening sky is exactly what stops the play.',
  'Choose the correct form: By the time the coach arrived, Surya ______ several matches.':
    'The coach\'s arrival is already a past moment, so the winning that happened before it needs the past perfect **had already won**, made of had plus the past participle. Using has already won puts the action in the present perfect, which cannot sit before another past event.',
  'What changes in the character in \'Change of Heart\'?':
    'The change happens inside him: he begins to care about **other people** and not only about winning, which is the change of heart the title promises. Thinking he becomes a coach mistakes a change of attitude for a change of job.',
  'What lesson does the story give about sport?':
    'The story keeps showing that **fairness and kindness** count for more than the result on the scoreboard. The idea that rules can be broken names the very behaviour the story punishes, so it cannot be the lesson.',
  'Who is a true winner in the poem?':
    'The poem calls a true winner the one who keeps **trying** and plays fairly even when the score runs against him. Answering that a winner is one who always comes first simply repeats the scoreboard thinking the poem is arguing against.',
  'Which quality does the poem praise?':
    'The quality the poem praises is **perseverance**, the habit of carrying on after a failure instead of giving up. Answering luck takes the credit away from the player\'s own effort, which is exactly what the poem honours.',
  'What does yoga mainly develop?':
    'Yoga trains the body and the mind together, so what it mainly builds is **physical and mental balance**. Saying it builds only muscle size treats yoga as weight training and ignores the breathing and stillness it also teaches.',
  'Why is yoga called \'a way of life\'?':
    'Yoga is called a way of life because its habits of **breathing and posture** shape ordinary days, not just one session on a mat. Calling it a competition misses the point, since yoga has no winners or losers.',
  'The past perfect tense is formed with':
    'The past perfect is built from **had** plus the past participle, as in had finished. Has plus the past participle makes the present perfect, which points to now rather than to an earlier moment in the past.',
  'Which sentence uses the past perfect correctly?':
    'In She had finished the race before it started to rain, **had finished** marks the earlier action and the simple past started marks the later one, which is exactly the job of the past perfect. The version with has finished mixes the present perfect with a past time and breaks that order.',
  'What does the Ek Bharat, Shreshtha Bharat programme help students understand?':
    'The programme teaches that every Indian belongs to **one nation** and shares a bond of unity in diversity. Saying each state should celebrate on its own turns a shared culture into separation, which is the opposite of the idea.',
  'How did Ila Sachani create her embroidery designs?':
    'Ila Sachani was born without working hands, so she learned to hold the needle with her **feet** and sew her designs. The machine answer invents a device the chapter never mentions, and her brother and sister never did the sewing for her.',
  'Why does the child in the poem wish to be small and light as air?':
    'Being small and light as air would let her climb onto a **kite**, sail up on its paper wings and look down at the park and the rooftops of the town. A common slip is to think she wants to escape the town, when she really wants to see it from above.',
  'Which sentence uses a word of quantity correctly with an uncountable noun?':
    'Milk cannot be counted one by one, so it takes **much**, as in How much milk do you want. How many rice uses the countable word with an uncountable noun, which is the usual mix-up.',
  'Where is the National War Memorial of India?':
    'The National War Memorial stands in **New Delhi**, close to India Gate. Picking Mumbai or Chennai confuses it with other city landmarks such as the Gateway of India.',
  'Whom does the National War Memorial honour?':
    'The memorial honours the **soldiers** who died for the country, which is why their names are inscribed on its walls. Thinking it honours only the President mistakes the person who lays a wreath for the people being remembered.',
  'What does the eternal flame at the memorial stand for?':
    'The **eternal flame** burns day and night as a sign that the memory of the fallen soldiers never goes out. Explaining it as a Diwali lamp turns a national memorial into a festival decoration.',
  'What makes India \'incredible\' according to the chapter?':
    'India is called incredible for its **many languages, festivals and traditions** living side by side. Answering that it is incredible for its size reduces a country of cultures to a measurement on a map.',
  'What does the chapter ask us to do with our heritage?':
    'The chapter asks us to **respect and preserve** our heritage so that the next generation inherits it intact. Thinking we should sell it treats a shared inheritance as property to be traded.',
  'What is remarkable about Ila Sachani?':
    'What makes Ila Sachani remarkable is that she **embroiders** fine work with her feet after her hands failed her. Saying she paints with her mouth borrows another artist\'s story and gets her craft wrong.',
  'What does her story show?':
    'Her story shows that **determination** can carry a person past a disability that others treat as the end of the road. Calling embroidery easy ignores the years of practice her feet needed before the stitches came out neat.',
  'Which word of quantity fits with \'water\'?':
    'Water cannot be counted off as separate units, so it takes **a little**, as in a little water. Many and several belong with things you can count, such as bottles or glasses of water.',
  'Which word of quantity fits with \'books\'?':
    'Books can be counted one by one, so they take **many**, as in many books. Much and a great deal of go with uncountable things such as water or rice, never with a countable plural.',
  'What do the kites in the poem stand for?':
    'The kites stand for **freedom and imagination**, lifting above the rooftops on nothing but wind and paper. Reading them as a sign of wealth adds a money meaning that the poem never suggests.',
  'Which image from the poem is most vivid?':
    'The kites are pictured **dancing like coloured birds** in the sky, a picture your eye can see and your ear can almost hear. The string is long is a plain fact, not an image, so it carries no picture at all.',
  'Why was Jahnavi not sent to school at first?':
    'Jahnavi stays home at first because her mother says she is **too small** and is needed to mind her little brothers. The answer about the school being across the river invents a distance problem that the story never gives as the reason.',
  'Whom did Helen Keller want to see first if she were given sight for three days?':
    'Given three days of sight, Helen Keller wants first to see the **people** whose kindness and companionship had made her life worth living. The dinosaurs and mastodons belong to a later day of her three-day plan, not the first.',
  'What did King Bruce learn from watching the spider?':
    'The spider fell again and again but kept climbing until it reached its **cobweb**, and that steady effort gave Bruce the heart to try once more and this time not fail. A frequent slip is to say the spider gave up, which would teach the opposite lesson.',
  'Jahnavi is afraid to speak to her father about school. Which sentence gives her advice using a modal verb correctly?':
    'The modal **should** is followed by the base verb tell, so the advice reads You should tell your father what you really want. Should told and must to tell both put a wrong form after the modal, which never takes -ed or to.',
  'Which word in \'The cat sat on the mat\' is a preposition?':
    '**On** is the preposition because it shows the relation between the cat and the mat. Picking mat chooses the noun that follows the preposition instead of the preposition itself.',
  'Which of these words is an adverb?':
    '**Quietly** is an adverb because it tells us how an action is done, and many adverbs like it end in -ly. Table and garden are naming words, so they cannot describe how something happens.',
  'In \'She walked quietly under the tree\', which word is the preposition?':
    '**Under** is the preposition because it places the walking in relation to the tree. Choosing quietly confuses an adverb, which tells how she walked, with a preposition.',
  'What is a simile?':
    'A simile compares two things using **like** or **as**, as in as brave as a lion. The description without like or as actually defines a metaphor, so it gives the opposite answer.',
  'Which sentence contains a simile?':
    'The word **like** is the signal, so Her smile was like sunshine compares the smile to sunshine. Her smile was sunshine calls the smile sunshine directly, which makes it a metaphor instead.',
  'What is a metaphor?':
    'A metaphor says one thing **is** another, as in her smile was sunshine, without using like or as. The definition built on like or as actually describes a simile, so it names the wrong figure.',
  'What does the river in the story ask of the people?':
    'The river asks the people to stop **polluting** it and to treat it with respect. Asking everyone to stop using water goes further than the river\'s plea, since water is still needed for daily life.',
  'What does giving the river a voice achieve in the story?':
    'Giving the river a voice makes the damage feel **personal**, because the reader hears the harm from the one who suffers it. Saying it hides the problem is backwards, since a speaking river makes pollution harder to ignore.',
  'What is the message of the poem \'Try Again\'?':
    'The poem\'s message is to **keep trying** even after failure, because success usually comes to the person who refuses to stop. Only try once turns the poem\'s advice upside down and would make the title meaningless.',
  'Which line best expresses the poem\'s advice?':
    'The line **if at first you do not succeed, try again** states the advice directly and matches the title of the poem. Failure is the end gives exactly the hopelessness that the poem argues against.',
  'What would Helen Keller do with three days of sight?':
    'She would spend the three days studying the **faces** of the people she loves and the wonders of nature. Watching films all day would waste the gift, because she wants real faces and real things, not a screen.',
  'What does the essay teach us?':
    'The essay teaches us to **value** the sight and hearing we use every day without thinking. Claiming that sight is not important misses the ache of a writer who has lived without it.',
  'Which modal verb expresses ability?':
    '**Can** expresses ability, as in I can swim across the pool. Must and should express duty or advice, which tell what ought to happen rather than what someone is able to do.',
  'Which sentence uses a modal verb correctly?':
    'The modal **should** is followed by the base verb ask, which is the correct pattern in You should ask before taking it. Should to ask adds to after a modal and should asks adds -s, and both of those forms are wrong.',
  'How did Polynesia make Doctor Dolittle believe that animals have a language of their own?':
    'Polynesia proved her point by actually speaking **bird language** aloud and then translating each sound, so the doctor heard the language working instead of only hearing about it. Thinking she wrote a book credits her with writing rather than demonstrating speech, which is not how she convinced him.',
  'Why does Mrs. Shaw first want Mary to go out for a walk when the guests arrive?':
    'Shaw is worried that Mary, raised in India and unused to English drawing-room talk, will blurt something awkward in front of visitors. The guests do not dislike children; the anxiety is about **what Mary might say**, which is why a quiet walk is suggested.',
  'What did the funny man do when the poet asked him why he wore two hats on his feet?':
    'The funny man answers with action rather than words: he simply turns around and hops home balanced on his head, still wearing the hats on his feet. The joke is that his **reply is another absurd act**, so the nonsense never breaks into a sensible explanation.',
  'Which sentence correctly uses the present perfect tense?':
    'Present perfect is **has or have plus the past participle**, so has learnt is correct for a single subject like Doctor Dolittle. Has learn leaves the verb in its base form, which cannot follow has in this tense.',
  'What is a phrasal verb?':
    'A phrasal verb pairs a verb with a particle such as up, off or down, and the pair carries a meaning the verb alone does not, as in **give up**. Two nouns together make a compound noun, not a verb phrase, so that description misses the verb entirely.',
  'What does \'give up\' mean?':
    'In **give up** the particle up changes give from handing something over into quitting an effort altogether, as when a climber gives up near the top. To hand something over translates give alone and ignores the particle that shifts the meaning.',
  'What does \'put off\' mean?':
    '**Put off** means to move something to a later time, as when a match is put off because of rain. To take away describes take away or remove, a different phrasal verb with a different particle and a different meaning.',
  'What is a suffix?':
    'A **suffix** attaches after the root and often changes the word\'s job, as -ness turns kind into the noun kindness. A group added at the start is a prefix, so that description names the opposite position on the word.',
  'Which sentence uses \'tell\' correctly?':
    'Tell normally takes a **person as its object** before the thing told, so told me a story is the natural pattern. Said me a story fails because say needs to before the listener, as in said to me.',
  'Add the suffix -ness to \'kind\'.':
    'Keeping kind whole and adding -ness gives **kindness**, the noun naming the quality of being kind. -ful is a different suffix that would build kindful, which English does not use, and -ly builds the adverb kindly.',
  'What special ability does Dr. Dolittle have?':
    'Doctor Dolittle\'s gift is **speaking with animals**, learnt from his parrot Polynesia, which lets him hear their troubles directly. Flying or becoming invisible belongs to other kinds of fantasy stories and is never part of his skill.',
  'How does talking to animals help the doctor?':
    'Because the animals can describe their own symptoms, the doctor treats the real problem instead of guessing, so **the patient\'s own words guide the cure**. Fame and money follow later as a result, but they are not what the ability is for.',
  'Which of these is a compound word?':
    'A **compound word** joins two complete words, and book plus case makes bookcase, a case for books. Happier and quickly are built with suffixes on a single root, so they are derived words rather than compounds.',
  'What makes a \'funny man\' amusing in the poem?':
    'The funny man\'s humour comes from **turning ordinary things upside down**, like wearing hats on his feet, so the reader is startled into laughing. Loud clothes alone would only be a costume; the joke lives in the odd logic behind the clothes.',
  'What is the effect of humour in the poem?':
    'Nonsense verse works by loosening the reader\'s grip on ordinary rules, so after laughing at hats on feet the world feels **lighter and less rigid**. A hidden moral would weigh the poem down, which is exactly what light humour avoids.',
  'What does \'say the right thing\' mean?':
    'Saying the right thing is about **fit, not length or bluntness**: the same sentence can be kind in one room and rude in another. Using long words confuses being impressive with being tactful, which is a different skill.',
  'Which reply is the most tactful?':
    'This reply thanks the questioner and then refuses gently, so the **refusal protects both people\'s dignity**. None of your business refuses too, but the sharp words wound the person who asked.',
  'Which sentence uses the present perfect correctly?':
    'With a singular subject the helper is **has**, and the main verb must be the past participle told, which this sentence gets right. Writing has telling puts the -ing form after has, a shape English never allows.',
  'Why did Papa get soaked at the front doorstep?':
    'Anand rigged a water bag over the door to trap burglars, so a gentle push released it onto Papa instead. The point of the joke is that the **alarm punished the innocent**, since a thief was the intended target.',
  'What surprised Shaana about Himachal Pradesh and Arunachal Pradesh?':
    'The shared word Pradesh made the two states sound like neighbours, yet **Himachal sits in the north and Arunachal in the far east**. Assuming a common name means a common place is the mistake the map corrects.',
  'What does the poet hope will happen to the paper boats he floats down the stream?':
    'The child floats his boats so that **a stranger in a far land may find them** and learn who he is, carrying shiuli flowers that should reach shore by night. The boats carry hope rather than cargo, which is why their load is flowers and dreams.',
  'Choose the sentence in which the subject and the verb agree.':
    'The plural subject boats needs the plural verb **float**, and this sentence matches them correctly. Boats floats adds -s to a verb that already has a plural subject, which is the commonest agreement slip in English.',
  'What is onomatopoeia?':
    '**Onomatopoeia** builds a word out of the sound it names, so buzz, hiss and crash imitate what they describe. A word with two meanings is homonymy, an unrelated idea about meaning rather than sound.',
  'Which word is an example of onomatopoeia?':
    '**Buzz** imitates the hum of a bee, so the word itself sounds like the thing it names. Quiet describes silence and slowly describes pace, and neither of them copies a sound.',
  'Which sentence is in the past perfect tense?':
    'Past perfect uses **had plus the past participle** to mark the earlier of two past events, and finishing came before the bell rang. She finished her work is simple past, which reports one event without showing which came first.',
  'What is the brother\'s invention about?':
    'The boy\'s inventions grow from **noticing a small daily nuisance** and building something to fix it, which is what makes them clever rather than grand. A pet or a playground game would be play, not an attempt to solve a problem.',
  'What quality does the story celebrate?':
    'The story rewards the child who asks why things are the way they are and then **actually builds and tests an answer**. Copying others or dodging mistakes would mean never risking an idea of your own, the opposite of what is praised.',
  'What do the paper boats carry in the poem?':
    'The boats are loaded with shiuli flowers and with the child\'s wish to be known in a distant land, so their real freight is **hope**. Treating them as real cargo misses that the whole poem turns on imagination rather than trade.',
  'Which image from the poem is most imaginative?':
    'A **paper boat** is a fragile toy, so sending it to a far country stretches reality and shows imagination at work. A river flowing or rain falling is ordinary description, accurate but not inventive.',
  'Which direction does the Sun rise from?':
    'The Earth turns from west to east, so the Sun appears first over the **eastern** horizon each morning. The west is where it sinks at dusk, the mirror image of sunrise and the usual wrong choice.',
  'If you face north, which direction is on your right?':
    'Facing north puts **east on your right**, south behind you and west on the left, the same order as a compass rose. Choosing west reverses left and right, the usual slip when turning the map over in the mind.',
  'Choose the correct sentence.':
    'Children is already plural, so it takes the plain verb **play** with no -s. Children plays adds the singular ending to a plural subject, and children is uses a singular helper, both breaking the same rule.',
  'Choose the sentence that is correct.':
    'A singular subject takes **has**, and the perfect tense needs the past participle built, which this sentence supplies. Has build keeps the base form, and have built uses the plural helper with only one inventor.',
  'Why did Suraj walk through the tunnel?':
    'Suraj\'s walk is driven by plain **curiosity**, not by a train to catch or a duty given to him by anyone. That small wish to see for himself is what turns an ordinary afternoon into the adventure the story tells.',
  'What did Arunima Sinha decide while she was in hospital with one leg amputated?':
    'Lying in hospital after losing a leg, Arunima set herself two goals: to **walk again** and then to stand on the summit of Everest. Becoming an instructor came later, as an outcome of the climb rather than the hospital vow.',
  'How does the speaker in Travel experience trains even though the railroad track is miles away?':
    'The speaker never needs the railway, because by day the **whistle shrieks** past her and at night she watches red cinders and hears the engine steaming. The train exists in sound and glow, so imagination supplies the journey the track cannot.',
  'Choose the sentence that uses articles correctly.':
    'A definite **the** suits the tunnel that speaker and listener both know, while a introduces one unspecified train, which is exactly the pairing here. An train fails because train begins with a consonant sound and needs a, not an.',
  'Which sentence shows a past habit using \'used to\'?':
    '**Used to** plus the base verb marks something done regularly in the past and no longer done now, which used to play states clearly. I am used to the park means accustomed to it, a different sense that describes the present.',
  'What does \'would\' often express in a story about the past?':
    'In narrative, **would** plus a base verb reports what happened again and again, as in every summer we would visit. A single finished event needs the simple past, because would cannot mark one completed act.',
  'Which sentence is grammatically correct?':
    'After **would** the verb stays in its base form, so would visit is right for a repeated summer habit. Would visited doubles the past marking, and would to visit inserts a to that would never takes.',
  'What is imagery in a poem?':
    '**Imagery** works through concrete sensory detail, so the reader sees, hears or smells what the poet describes. Rhyme is a sound pattern at line endings and can exist with no picture at all, so it is not imagery.',
  'Which line uses strong imagery?':
    '**Silver** gives a colour and **sails** gives motion, so the moon becomes a visible thing crossing the sky. The moon is round states a fact with no picture, which is why it feels flat beside the other line.',
  'What makes two words rhyme?':
    'Rhyme depends on the **final stressed sound**, so cat and hat rhyme while cat and cot do not. Starting with the same letter is alliteration, a likeness at the beginnings of words rather than at their ends.',
  'What does a tunnel in the story usually stand for?':
    'A tunnel is dark and enclosed, so writers use it for **a hard stretch you must pass through** before reaching open ground. A bridge carries you over an obstacle, which is the opposite image of going through one.',
  'What does the character learn inside the tunnel?':
    'In the dark the character must keep moving without seeing the end and must rely on whoever is with him, so **courage and trust** are what the passage teaches. Learning only the way home would make the tunnel a shortcut rather than a test.',
  'What does travel give a person, according to the poem?':
    'The poem treats travel as a way of **meeting places and people outside your own experience**, which widens how you see the world. Tiredness may come with the journey, but the poem presents it as the price, not the gift.',
  'Which line from the poem best shows the joy of travel?':
    '**The road calls** makes travel sound like an invitation the speaker cannot refuse, which is joy rather than duty. A late train or a heavy bag reports a complaint and shows the burden of travel, not its pull.',
  'What is the hardest part of climbing a mountain?':
    'The summit is won by **continuing after the body wants to stop**, through cold and exhaustion, long before the top is reached. Buying equipment happens before the climb and photographs after it, so neither of them tests the climber.',
  'What quality does a mountaineer need most?':
    'A climb is decided by who keeps putting one foot above the other over days of cold and thin air, so **perseverance** matters more than any single burst of strength. Speed helps only briefly, and luck cannot be relied on twice.',
  'Which sentence uses the correct article?':
    'The h in **honest** is silent, so the word opens with a vowel sound and takes an. A honest judges by the letter rather than the sound, which is the usual reason learners pick the wrong article here.',
  'Which article is used before a vowel sound?':
    '**An** exists to smooth the join before a vowel sound, as in an apple or an hour. The article a is chosen for consonant sounds, so it is the mirror rule rather than the same one.',
  'What is each brick of the National War Memorial called, and what does it bear?':
    'Each brick of the memorial is a **tablet** inscribed with the names of soldiers who made the supreme sacrifice for India, so the wall reads as a roll of honour rather than a record of battles. The option naming the wars India fought mistakes the purpose of the memorial, which is to honour people and not list conflicts.',
  'How did Rani Abbakka answer the Portuguese envoy who demanded the annual tribute?':
    'She told the envoy that **Ullal was a sovereign country** which paid no tribute and took no orders from Portugal, refusing the demand outright. The option in which she offers half the tribute misreads her as bargaining, when the queen actually rejected the claim altogether.',
  'What does the poet praise the soldiers for in My Dear Soldiers?':
    'The poet praises the soldiers for staying **awake on the borders** while the rest of the nation sleeps, enduring wind, snow and scorching heat across mountains, deserts, marshes and seas. He honours the prime of their youth given to the country, so the praise is for sacrifice rather than for victories or medals.',
  'Choose the correct indirect form: Rani Abbakka said, "We do not pay tribute to Portugal."':
    'In reported speech the present tense do not pay shifts back to **did not pay**, and the pronoun we becomes they because the reporter stands outside the group. Leaving we in place simply copies the speaker\'s words instead of reporting them, which is still direct speech.',
  'What is a prefix?':
    'A prefix is a letter group fixed to the **beginning** of a word to change its meaning, as un- does in unhappy. Confusing it with a suffix, which is added at the end, is the commonest error because both are affixes that alter a root word.',
  'What does the prefix \'un-\' usually mean?':
    'The prefix **un-** reverses or negates the word it joins, so unhappy means not happy and unable means not able. The answer again belongs to re- as in rebuild, so choosing it mixes up two prefixes that carry completely different meanings.',
  'Which of these words is a subordinating conjunction?':
    '**Because** is a subordinating conjunction because it introduces a dependent clause that cannot stand alone, as in he stayed because it rained. And, but and or are coordinating conjunctions joining two equal clauses, which is why they cannot do that job.',
  'What is a collocation?':
    'A **collocation** is a pairing that speakers habitually use together, like heavy rain or make a decision, so the words sound natural as a unit. Words with the same meaning are synonyms, and mixing those two labels is the usual mistake.',
  'Which pair is a natural collocation?':
    'English speakers say **heavy rain** because heavy is the word that describes the intensity of weather, and the pairing is fixed by habit rather than logic. Strong rain feels reasonable but strong usually collocates with wind or currents, so it sounds foreign to a fluent ear.',
  'Which word goes naturally with \'make\'?':
    '**Make a decision** is the fixed pairing, since make goes with decisions, plans and mistakes while do goes with tasks. A homework also fails on the article, because homework is uncountable and takes no a before it.',
  'Whom does the chapter pay homage to?':
    'The chapter offers **homage to soldiers** who gave their lives for the country, treating every rank alike in its gratitude. Naming only the generals narrows the tribute to commanders, which contradicts the idea that each brick carries an ordinary soldier\'s name.',
  'What is a homage?':
    '**Homage** means a public sign of respect, such as a ceremony or a bowed head offered to someone being honoured. A medal is a reward given for service rather than the act of showing respect, so that option confuses the token with the gesture.',
  'What does the poem ask of the soldiers\' families?':
    'The poem asks the families to be **proud** of their soldiers\' sacrifice, since that pride is offered as comfort for the separation they bear. Asking them to forget would contradict the poem, whose whole purpose is remembrance of what the soldiers gave.',
  'Who was Rani Abbakka?':
    'Rani Abbakka was a **queen of coastal Karnataka** who resisted Portuguese demands for tribute and fought them in the sixteenth century. Placing her in Bengal or at a Mughal court moves her to another region and era, which the chapter never suggests.',
  'Why is Rani Abbakka remembered?':
    'She is remembered for her **courage in defending her land**, refusing tribute and holding off a far better armed Portuguese force. Building temples or writing books credits her with achievements the chapter does not mention at all.',
  'Change to indirect speech: She said, "I am brave."':
    'The present am backs to **was** and the first-person I changes to she when someone else reports the words. Keeping is or I am untouched merely repeats the original quotation, which is exactly what indirect speech is meant to replace.',
  'Which word often introduces indirect speech?':
    '**That** usually links the reporting verb to the reported clause, as in she said that she was brave. Which, whose and whom are relative pronouns, so they introduce describing clauses rather than reported speech.',
  'What do the soldiers protect, according to the poem?':
    'The poem says the soldiers guard the country\'s **peace and safety**, standing watch so that people behind the border can live without fear. Limiting their care to their own families ignores the wider duty to the nation that the poem keeps returning to.',
  'In ‘The Wit that Won Hearts’, why had King Krishnadeva Raya stopped speaking to Queen Thirumalambal?':
    'The king stopped speaking to Queen Thirumalambal because he believed her **yawn** while he recited his poem was an insult to his verse. The option about her tearing the poem invents a physical act, when the offence was a gesture he chose to read as contempt.',
  'When Tenali Rama brought his ‘special’ paddy seeds to the court, what did he say the real problem was?':
    'Tenali Rama\'s point was that the **sower, not the seed**, is the real problem, since the court had blamed the farmers for a poor crop. The option about special royal soil adds a condition the story never raises, turning a lesson about responsibility into a tale about farming technique.',
  'Which sentence correctly rewrites ‘It is advisable for you to think before you speak’ using a modal verb?':
    '**Should** carries the sense of advice, so it matches what is advisable without sounding like a command. Might have thought points to a past possibility that never happened, which turns advice into regret about the past.',
  'In ‘A Concrete Example’, the speaker and Mrs Jones talk about a flower for a quarter of an hour. Why does Mrs Jones finally reply, ‘You’re standing on it’? What does this reply reveal about the humour of the poem?':
    'The lovely thing they discuss is a **tiny plant between the stones**, and the speaker has been standing on it all through the conversation. The joke works because the treasure lay underfoot while they searched, and the title\'s pun on concrete, both paving material and a clear example, quietly sets up the twist.',
  'What does wit usually mean in these stories?':
    'In these stories **wit** means quick, clever thinking that gets someone out of a difficulty, as Tenali Rama\'s trick does. Physical strength is its opposite, and reading wit as loud laughter confuses the cleverness itself with the amusement it produces.',
  'Why do people enjoy wit in a story?':
    'Wit delights readers because it produces an **unexpected but fitting answer** that the listener did not see coming. Long words are not the source of that pleasure, and a story avoiding all conflict would leave the wit nothing to resolve.',
  'What did Tenali Rama discover about the paddy seeds given to the farmers?':
    'The seeds had been **boiled**, so they could never sprout, which proved the farmers were cheated rather than careless. The idea that the seeds needed more water accepts the official excuse and misses the deliberate fraud behind the failure.',
  'How did Tenali Rama expose the truth?':
    'He took his own share of the seeds and **sowed them**, letting the court see that nothing came up, so the blame fell on the seeds rather than on the farmers. Writing a letter would only have produced another denial, which is why the public demonstration mattered.',
  'What is the poem \'A Concrete Example\' about?':
    'The poem turns on a **small act of care** that quietly grows into something lasting, which is why the tiny plant matters more than its size suggests. Reading it as a guide to building a house takes the word concrete literally and loses the poem\'s point.',
  'Why is the poem\'s title a pun?':
    'The title is a pun because **concrete** is both the paving material of the garden and the sense of something definite and clear. Claiming there is no title, or that the poem is written as concrete poetry, ignores the double meaning it actually plays on.',
  'Which word is a modal verb?':
    '**Should** is a modal verb because it sits before a main verb to show advice, obligation or possibility. Wisdom and way are nouns and walk is an ordinary verb, so none of them can change the mood of another verb.',
  'What does the modal \'must\' express?':
    '**Must** expresses strong obligation, as in you must submit it today, and also certainty, as in she must be tired. A polite question is the work of may or could, so that option mistakes a request for a command.',
  'Choose the sentence in which the verb agrees with its subject.':
    'The subject here is **a bouquet**, which is singular, so the verb takes is, while the phrase of flowers merely describes it. A bouquet of flowers are is the classic trap of matching the verb to the nearest noun instead of the head word.',
  'Major Somnath Sharma told his senior officers, ‘I know my men better than anyone else, and if they are going into action, they are not going in without me.’ What does this statement show about him?':
    'His words show that he was **determined to share his men\'s danger**, refusing to stay behind with an injured hand while they went into action. The option about disobeying orders reverses his meaning, since he was asking to go with them and not refusing to go.',
  'According to Verghese Kurien’s letter to his grandson, what makes a life ‘well-spent’?':
    'Kurien says a life is **well spent** when one uses one\'s talents as fully as possible and adds to the common good. Avoiding every risk sounds safe but produces nothing, which is exactly the caution his letter argues against.',
  'In ‘Somebody’s Mother’, the boy tells his friends, ‘She’s somebody’s mother, boys, you know.’ Why does this line matter, and how does the last stanza answer it?':
    'The line turns a stranger into **somebody\'s mother**, so the boy owes her the care he would want for his own mother. The last stanza returns the phrase as somebody\'s son, showing that every person is loved by someone, which closes the kindness into a circle.',
  'Which sentence has correct subject-verb agreement?':
    'The head noun is **the list**, which is singular, so is is correct and the names only form part of the phrase describing it. The list of names are is wrong because it agrees with the nearer plural noun rather than with the subject.',
  'What does a dash usually mark in a sentence?':
    'A dash marks a **pause before an added or surprising idea**, letting a writer drop in a remark without starting a new sentence. It is not a question mark, so the option about ending a question confuses two very different punctuation marks.',
  'Why is Major Somnath Sharma remembered?':
    'He is remembered for **holding his post against great odds**, fighting on with a wounded hand so that others could be protected. Building a bridge or leading a parade would be peacetime achievements, and neither appears in the account of his last stand.',
  'Which value does his story best illustrate?':
    'His story illustrates **courage and duty**, because he chose to stay with his soldiers when he could have been excused. Cleverness and wit belong to the Tenali Rama tales, a different kind of story carrying a different lesson.',
  'In the poem, what does the boy do for the old woman?':
    'The boy **helps the old woman cross** the slippery street, steadying her so that she does not fall. Giving her money would end the encounter quickly, and the poem insists that presence and effort, not cash, were what she needed.',
  'What is the poem\'s message?':
    'The message is to treat every older stranger with the **kindness you would show your own mother**, because each one is somebody\'s mother. Telling old people to stay indoors blames them for the difficulty instead of asking the young to help.',
  'What did Verghese Kurien help create?':
    'Kurien helped build a **milk cooperative** that let village farmers own the processing and share the profit, which reshaped rural livelihoods. A steel factory or a railway network belongs to heavy industry, and neither matches the dairy work his name is linked with.',
  'What does \'I too had a dream\' show about Kurien?':
    'The title shows that he believed **ordinary people** could build something great together, which is why the cooperative was run by the farmers themselves. The claim that he worked only for himself contradicts the whole idea of a shared enterprise.',
  'Which question did Encyclopedia Brown ask that unlocked the case of the fifth word?':
    'The fifth word only made sense once the detective learned that a single **young fir tree** grew among the palms, giving the writer a real reason to know and use that word. Chasing the robbery or the clerk\'s identification misses the puzzle, because the code turns on one word that only that nursery could explain.',
  'How had Tim Nolan built the four-word code ‘Nom Utes Sweden Hurts’?':
    'Delete the letters d-a-y from Monday, Tuesday, Wednesday and Thursday and the leftovers spell **NOM UTES SWEDEN HURTS**, which is why the message looked like nonsense. Assuming the words name countries or months fails, since Sweden is only the middle of Wednesday with day cut away.',
  'Which of the wonders described in ‘Spectacular Wonders’ is the only crater in India formed in basaltic rock by a meteorite impact?':
    '**Lonar Crater Lake** in Maharashtra lies in the Deccan basalt and was scooped out when a meteorite struck that hard volcanic rock, which is why it is singled out as unique in India. Choosing the Valley of Flowers confuses a scenic valley with an impact crater, since no falling body formed it.',
  'In ‘The Magic Brush of Dreams’, Gopi tells the Zamindar, ‘My lord, I can’t comply.’ Why does she refuse, and how does the rest of the poem show that she was right to refuse?':
    'Gopi refuses because the brush\'s giver bound her to paint **only for the poor**, while the Zamindar wants a fortress, treasure and jewels to rule the land. Reading her refusal as stubbornness misses the reward that follows, since painted roads, a horse and a river free her and the closing feast feeds the village.',
  'What kind of story is \'The Case of the Fifth Word\'?':
    'The shape of a **detective puzzle** shows in the way a coded message and a set of suspects are untangled by deduction rather than luck. Calling it a folk tale about a king misses that the plot moves on evidence the reader can follow and check.',
  'What helps the detective solve the case?':
    'The case opens because one **small detail**, a word that did not fit its surroundings, was noticed and then followed up. Guessing without evidence could never do it, since a detective must show why the answer is the only one that fits.',
  'What is close observation?':
    'Close observation means **slowing down** to examine details that a quick glance would slide over, patiently and more than once. A single hurried look is exactly what the phrase rules out, so it cannot count as observation at all.',
  'Why is critical thinking useful when reading a mystery?':
    'Critical thinking makes you **test each clue** against the others instead of accepting what a suspect or a narrator simply asserts. Expecting it to hand over the answer at once misunderstands it, because testing claims takes the length of the book.',
  'What is the magic brush able to do in the folk tale?':
    'Whatever the brush paints becomes **real**, which is why a painted road, horse and river can carry the painter away. The brush never simply makes its owner rich, and reading it that way misses the point that the gift answers need rather than greed.',
  'What lesson does the folk tale usually teach?':
    'The tale ends with the gift serving the **village** and giving nothing to the powerful, so its lesson is that talent should help others instead of feeding greed. Believing magic solves every problem ignores the ending, where the ruler\'s own greed is what defeats him.',
  'Which of these is a \'spectacular wonder\' of India described in the chapter?':
    'The **rock-cut caves** of Ajanta and Ellora were carved by hand out of living stone centuries ago, which is why they count among India\'s wonders. An airport terminal or a shopping mall is recent construction, so it belongs to a different category and cannot be heritage.',
  'Why should such wonders be protected?':
    'These places are **irreplaceable heritage**, holding centuries of craft and belief that no rebuilding could bring back once lost. Ticket money and great age are side effects rather than the reason, since a collapsed ruin earns nothing at all.',
  'What did Grandfather tell Rakesh when Rakesh asked whether cherry seeds are lucky?':
    'Grandfather replies that nothing is lucky if you **put it away**, and that luck comes only when a thing is put to some use, which is why Rakesh plants the seed. Treating the seed as a charm to be stored safely mistakes the advice entirely, because a thing kept aside stays useless.',
  'What explanation did the old woman give Velu for the long wait without rain?':
    'She says the **land is resting**, because Nature gives her children the rest they need before the rains return. Blaming the farmers\' choice of crop or the astrologers misses that her answer is about a natural cycle rather than human error.',
  'Complete the sentence with the correct determiner: ‘After months without rain, Velu had ______ hope left.’':
    'Hope is an **uncountable** noun, so it takes little, which measures amount rather than number. Few belongs with countable things such as days or rupees, and many or several would absurdly suggest Velu still had plenty of hope.',
  '‘Harvest Hymn’ moves from the voices of men to the voices of women and then to all voices together. What does this movement suggest about the harvest?':
    'The hymn widens from men praising **Surya and Varuna**, to women praising Prithvi, to every voice praising Bramha, so thanks spread across the whole of village life. Treating the stanzas as separate songs misses that the shared final voice presents the harvest as common work of sun, rain, earth and labour.',
  'How does the cherry tree begin in Ruskin Bond\'s story?':
    'The tree begins as a **seed** that Rakesh plants and tends, so its whole life stays bound to his patient care. A tree already grown, or a cutting bought in the market, would remove the slow tending that gives the story its meaning.',
  'What does the story suggest about growth?':
    'Growth here is counted in **years of patient care**, from a seed to a fruiting tree that the grandfather and then the family enjoy. Expecting it overnight contradicts the story\'s whole span, and that long wait is what makes the first fruit feel earned.',
  'What is the \'Harvest Hymn\' mainly about?':
    'The poem is a **thanksgiving** for sun, rain and earth at harvest, offered by the people who live by them. Looking for a battle or a journey confuses a hymn of praise with narrative action, of which the poem contains none.',
  'Which feeling runs through the poem?':
    '**Thankfulness** and joy carry the whole hymn, from the men\'s praise of rain to the women\'s praise of the earth that feeds them. Sadness and loss appear nowhere, because the occasion of the poem is plenty rather than want.',
  'What is the mood of \'Waiting for the Rain\'?':
    'The mood holds **hope** and anxiety together, as every sign of rain is watched for while the dry spell drags on. Calling it a celebration of harvest reads the wrong season, since the poem is set before the rain has come.',
  'Why is rain so important to the people in the poem?':
    'Every **crop and livelihood** in the poem hangs on the rain, which is why the waiting is so tense. Treating rain as something needed for games or clean roads makes it a small convenience and ignores that hunger and ruin are at stake.',
  'Which word in \'those tall trees\' is a determiner?':
    '**Those** points to which trees are meant, and pointing words such as this, that and those are determiners. Tall is an adjective describing the trees, while trees is the noun the whole phrase is built around.',
  'What was the Chipko Movement about?':
    'Villagers wrapped their arms around trees so loggers could not cut them without harming people, which is what gave **Chipko** its name from the word for embrace. Cleaning rivers or planting flowers in cities is environmental work of another kind and does not describe this movement.',
  'What made the narrator suddenly understand why Claribel had fainted?':
    'He recalls that miners took **canaries** underground because the birds collapse before people notice the gas, which explains Claribel\'s faint as a living warning. Blaming the alarm circuit or a frozen purifier looks for a machine fault and misses the warning the bird itself gave.',
  'Which of these sentences is written in the active voice?':
    'In this sentence the **doer comes first** and acts on the star, which is the mark of the active voice. The version saying the star was renamed by the union reverses that order, so its subject only receives the action and the sentence is passive.',
  'In 2019, which star did the International Astronomical Union rename ‘Bibha’ in honour of Bibha Chowdhuri?':
    'The union renamed **HD 86081**, a star in the constellation Leo, as Bibha to honour the physicist. Confusing it with Sirius or the pole star substitutes famous bright stars for the comparatively faint one that was actually chosen.',
  'In ‘Magnifying Glass’, the last stanza moves from a scrap of chalk and a drop of water to the moon. Why does the poet make this leap?':
    'Leaping from chalk and a water drop to the **moon** shows the glass changing the scale of the world rather than merely enlarging small things. A reader who stops at moss and insects misses the last stanza\'s point, that looking closely makes even the distant feel reachable in an afternoon.',
  'In \'Feathered Friend\', what is the surprising thing the crew discovers?':
    'The crew finds a **small bird** alive aboard the space station, which startles them because nothing was expected to survive there. Looking for a new planet or hidden treasure misses that the surprise is small and domestic rather than grand.',
  'What does the story say about life in space?':
    'The story turns on a **small living thing** whose presence and needs upset the station\'s careful arrangements. Believing space is completely empty ignores the whole premise, since the bird could not be aboard at all if it were.',
  'What does a magnifying glass do in the poem?':
    'The glass turns an inch of moss into a forest and a drop of water into something like a hive of **bees**, so smallness becomes wonder. Treating it as a measuring tool or a colour changer gives it a job the poem never mentions.',
  'What feeling does the poem create about discovery?':
    'The poem creates **wonder** at ordinary things, which change when looked at closely instead of being replaced by something exotic. Fear of science or boredom with nature runs against a poem that finds magic in chalk dust.',
  'What did Bibha Chowdhuri study?':
    'Bibha Chowdhuri worked on **cosmic rays** and the tracks that subatomic particles leave in photographic plates, at a time when very few women did physics. Plant breeding or ocean currents belong to other sciences and would miss her place in particle physics.',
  'Why is her story inspiring to students?':
    'She did **pioneering** work with limited equipment and against the expectations of her time, which is what makes her example encouraging. Becoming famous overnight is the opposite of her story, which was long, quiet and often unrecognised.',
  'Which sentence is in the active voice?':
    'The **scientist** performs the action and stands at the front of the sentence, which makes it active. The version saying the beam was measured by the scientist states the same event passively, with the receiver of the action promoted to subject.',
  'Which suffix turns \'science\' into a person?':
    'Adding **-ist** to science gives scientist, the person who does the science, just as art gives artist. The suffix -ness builds abstract nouns like sickness and -ly usually builds adverbs, so neither can name a person.',
  'Which number comes just before 60?':
    'Counting back one step from 60 gives **59**. The mistake is picking 61, which is the number that comes after 60, not before.',
  'Which of these numbers is the smallest?':
    'None of these numbers has ones, so the one with the fewest tens is smallest: 4 tens is **40**. The mistake is picking 54, because it is the biggest number here, not the smallest.',
  'Ravi has 7 marbles. His friend gives him 6 more marbles. How many marbles does Ravi have now?':
    'Start at 7 and count on six more: 8, 9, 10, 11, 12, 13, so Ravi has **13** marbles. The mistake is counting 7 itself as one of the six and stopping at 12.',
  'Add 47 and 28.':
    'Add the ones first: 7 + 8 = 15, so write 5 and carry 1; then 4 tens + 2 tens + 1 = 7 tens, giving **75**. The mistake is forgetting the carry and writing 65, because 4 + 2 tens alone is only 6 tens.',
  'Which number comes just after 39?':
    'Counting on one step from 39 gives **40**. The mistake is picking 38, which sits just before 39 instead of after it.',
  'Which number is greater, 27 or 72?':
    'Both numbers use a 2 and a 7, but 72 has 7 tens while 27 has only 2 tens, so **72** is greater. The mistake is picking 27 because the 7 looks bigger at the end.',
  'Which is the smallest number: 45, 54, 40, 50?':
    'The tens are 4, 5, 4 and 5, so the smallest must be 45 or 40, and 40 has fewer ones, making **40** the smallest. The mistake is picking 54 because it is the largest of the four.',
  'How many single-digit numbers are there from 1 to 9?':
    'Count them one by one: 1, 2, 3, 4, 5, 6, 7, 8, 9, so there are **9** single-digit numbers. The mistake is counting 0 as well, which would make ten.',
  'Which of these is a single-digit number?':
    'A single-digit number is written with just one digit, and **7** is the only one here. The mistake is picking 17, which has two digits and is therefore not a single-digit number.',
  'In the number 34, which digit is in the tens place?':
    'In a two-digit number the first digit shows the tens, so in 34 the tens digit is **3** and the 4 shows the ones. The mistake is picking 4, which is the ones digit, not the tens digit.',
  'How many double-digit numbers are there from 10 to 99?':
    'From 10 to 99 there are 99 numbers in all, minus the 9 one-digit numbers, which gives **90**. The mistake is answering 99, which is the last number, not how many there are.',
  'Which number comes just before 80?':
    'One step back from 80 gives **79**, because 79 is the number just below it. The mistake is picking 81, which comes after 80, not before.',
  'Which shape is round and has no corners?':
    'A **circle** is one smooth curve all the way round, so it has no corners and no straight sides. The mistake is picking a square, which has four corners.',
  'How many corners does a rectangle have?':
    'Trace a rectangle from corner to corner: top left, top right, bottom right, bottom left, which makes **4** corners. The mistake is choosing 3 by thinking of a triangle, which has only three.',
  'Ravi makes a pattern with shapes: triangle, square, triangle, square, and so on. He uses 8 shapes in all. How many triangles does he use?':
    'The shapes go triangle, square, triangle, square, triangle, square, triangle, square, so the triangles are in places 1, 3, 5 and 7, which makes **4**. The mistake is choosing 3 by losing count of the last pair.',
  'Write the next three numbers in the pattern 5, 10, 15, 20, ...':
    'Each number is 5 more than the one before: 20 + 5 = 25, 25 + 5 = 30, 30 + 5 = 35, so the next three are **25, 30 and 35**. The mistake is adding 1 each time and writing 21, 22, 23.',
  'Which of these objects is shaped like a rectangle?':
    'A **door** is flat with four straight sides and four corners, just like a rectangle. The mistake is picking a coin, which is round like a circle, not a rectangle.',
  'What comes next: 2, 4, 6, 8, ___?':
    'The numbers jump by 2 each time, so 8 + 2 = **10**. The mistake is adding 1 and choosing 9, which breaks the jump of two.',
  'What comes next: 5, 10, 15, ___?':
    'Each number is 5 more than the one before, so 15 + 5 = **20**. The mistake is adding just 1 to get 16, which breaks the jump of five.',
  'In the pattern circle, square, circle, square, ___, what comes next?':
    'The two shapes take turns, and a square is always followed by a **circle**. The mistake is choosing square, which would put two squares side by side.',
  'A pattern that repeats the same shapes again and again is called':
    'When the same shapes come back in the same order again and again, it is **a repeating pattern**. The mistake is calling it growing, which would add a new shape each time.',
  'Which shape has three sides?':
    'A **triangle** has three straight sides and three corners. The mistake is picking a square, which has four sides, one too many.',
  'Which shape has four equal sides?':
    'A **square** has four sides that are all the same length. The mistake is picking a rectangle, which has four sides but two long and two short.',
  'How many sides does a rectangle have?':
    'Count the edges of a rectangle: top, bottom, left and right, so it has **4** sides. The mistake is saying 3 because a triangle has three.',
  'In the number 472, what is the value of the digit 7?':
    'The 7 sits in the tens place of 472, so it stands for 7 tens, which is **70**. The mistake is reading it as plain 7, which is what a digit in the ones place is worth.',
  'Which of these is the expanded form of 358?':
    '358 is 3 hundreds, 5 tens and 8 ones, so it is **300 + 50 + 8**. The mistake is writing 30 + 50 + 8, which makes the hundreds worth only thirty.',
  'There are 246 books in a cupboard. 87 more books are put into it. How many books are in the cupboard now?':
    'Add the ones: 6 + 7 = 13, write 3 and carry 1; then 4 + 8 + 1 = 13, write 3 and carry 1; then 2 + 0 + 1 = 3, so there are **333** books. The mistake is dropping a carry and getting 323.',
  'Write the three-digit number that has 6 hundreds, 0 tens and 9 ones.':
    'Six hundreds go first, the tens place stays empty with 0, and nine ones go last, giving **609**. The mistake is skipping the 0 and writing 69, which has only two digits.',
  'What is the smallest three-digit number?':
    'A three-digit number needs a hundreds digit, and the smallest is 1 hundred with nothing else, so **100**. The mistake is choosing 10, which has only two digits.',
  'What is the largest three-digit number?':
    'Put the biggest digit 9 in all three places to get **999**. The mistake is choosing 1000, which needs four digits, not three.',
  'In 472, which digit is in the hundreds place?':
    'Digits are read from the left, so the first one is the hundreds place, which here is **4**. The mistake is picking 2, which is the ones digit at the far right.',
  'How many tens are there in 350?':
    '350 is 3 hundreds, 5 tens and 0 ones, so it holds **5** tens. The mistake is saying 35, which counts the hundreds in as well.',
  'What is 600 + 30 + 5?':
    '6 hundreds, 3 tens and 5 ones make **635**. The mistake is swapping the tens and the ones to get 653, which puts the 5 in the tens place.',
  'What is the expanded form of 208?':
    '208 is 2 hundreds, 0 tens and 8 ones, so it is **200 + 0 + 8**. The mistake is writing 200 + 80, which would make 280.',
  'What is 47 + 25?':
    'Add the ones: 7 + 5 = 12, so write 2 and carry 1; then 4 + 2 + 1 make 7 tens, so the answer is **72**. The mistake is forgetting the carry, which gives 62.',
  'What is 63 - 28?':
    'Take 20 away from 63 to get 43, then take 8 more to get **35**. The mistake is answering 45 by taking away only the 20 and forgetting the 8.',
  'Which multiplication fact means the same as 5 + 5 + 5?':
    'There are three equal groups of 5, so the fact is **3 x 5**. The mistake is choosing 5 x 5, which would mean five groups of five, not three.',
  'A chocolate box has 4 rows of chocolates with 6 chocolates in each row. How many chocolates are in the box?':
    'Four rows of six make 6 + 6 + 6 + 6 = **24** chocolates. The mistake is adding 4 + 6 = 10, which puts the rows and the chocolates together.',
  'A packet has 5 pencils. How many pencils are there in 6 packets?':
    'Six packets of five make 6 x 5 = 5 + 5 + 5 + 5 + 5 + 5 = **30** pencils. The mistake is adding 6 + 5 = 11 instead of repeating the five.',
  'What is 5 × 7?':
    'Five sevens make **35**, because 7 + 7 + 7 + 7 + 7 = 35. The mistake is answering 30, which is five sixes, not five sevens.',
  'What is 4 + 4 + 4 written as multiplication?':
    'There are three equal groups of 4, so it is **3 x 4**. The mistake is writing 3 + 4, which is a sum, not groups of the same number.',
  'What is 2 + 2 + 2 + 2 + 2?':
    'Add the twos one by one: 2, 4, 6, 8, **10**. The mistake is adding 5 + 2 = 7, which adds the count to the number instead of five twos.',
  'What is 5 x 6?':
    'Count the sixes as they grow: 6, 12, 18, 24, **30**. The mistake is adding 5 + 6 = 11, which adds the two numbers instead of repeating six.',
  'What is 10 x 7?':
    'Ten sevens make **70**, because multiplying by 10 puts a zero after the 7. The mistake is writing 107 by copying the numbers side by side.',
  'An array has 3 rows with 4 dots in each row. How many dots are there?':
    'Three rows of four make 4 + 4 + 4 = **12** dots. The mistake is adding 3 + 4 = 7, which joins the rows to the dots instead of repeating them.',
  'Which multiplication does an array of 2 rows and 5 columns show?':
    'Two rows with five dots in each row show **2 x 5**. The mistake is writing 2 + 5, which joins the numbers instead of showing equal rows.',
  'A box has 6 pencils. How many pencils are in 3 boxes?':
    'Three boxes of six make 6 + 6 + 6 = **18** pencils. The mistake is adding 6 + 3 = 9, which counts the boxes as if they were pencils.',
  'Each child has 2 shoes. How many shoes do 8 children have?':
    'Eight children with two shoes each make 8 x 2 = 2 + 2 + 2 + 2 + 2 + 2 + 2 + 2 = **16** shoes. The mistake is adding 8 + 2 = 10 instead of doubling the 8.',
  'In the number 5678, what is the place value of the digit 5?':
    'The digit 5 sits in the thousands place, so its place value is 5 x 1000 = **5000**. The answer 500 counts the hundreds place, where the 6 stands, not the 5.',
  'Which of these numbers is the greatest?':
    'All four start with 4 thousands, so compare the hundreds: 4890 and 4809 both have 8, and then the tens digit 9 beats 0, making **4890** the greatest. 4098 loses earlier because its hundreds digit is 0.',
  'Ravi writes his age in Roman numerals as XI. His sister writes her age as IX. How many years older is Ravi than his sister?':
    'XI means 10 + 1 = 11 and IX means 10 - 1 = 9, so the gap is 11 - 9 = **2 years**. Saying 3 years comes from adding the I in IX instead of subtracting it.',
  'Write the Roman numerals for 24 and 40.':
    'Split 24 into 20 + 4, which is XX + IV = **XXIV**, and write 40 as 50 - 10 = **XL**. Writing XXXX for 40 breaks the rule that a smaller numeral before a larger one is subtracted.',
  'In 5,482 which digit is in the thousands place?':
    'Reading from the left, 5,482 is 5 thousands, 4 hundreds, 8 tens and 2 ones, so the thousands digit is **5**. Picking 4 means counting the hundreds place instead of the thousands place.',
  'How many hundreds are there in 3,700?':
    'The places in 3,700 read 3 thousands, 7 hundreds, 0 tens, 0 ones, so the hundreds digit is **7**. The answer 37 is the count of whole hundreds in the number, which is a different question.',
  'Which number is the largest: 4,099, 4,909, 4,990, 4,009?':
    'All four have 4 thousands and a 9 in the hundreds, so the tens digit decides and 9 beats 0, making **4,990** the largest. 4,099 is smaller because its hundreds digit is 0.',
  'Which sign makes the sentence true: 6,300 ___ 6,030?':
    '6,300 has 3 hundreds while 6,030 has 0 hundreds, so 6,300 is bigger and the sign is **>**. Using < means treating 6,300 as smaller, which happens if the digits are read left to right without place value.',
  'Which Roman numeral stands for 50?':
    'Roman numerals step up in value, and **L** is the symbol for 50, just as V is 5 and X is 10. Picking C mistakes 50 for 100, the next symbol up.',
  'What is XL in Hindu-Arabic numerals?':
    'X (10) is written before L (50), so we subtract: 50 - 10 = **40**. Reading it as 60 adds the two symbols instead of subtracting the smaller one.',
  'In Roman numerals, when a smaller numeral is written before a larger one, we':
    'A smaller numeral placed before a larger one is taken away from it, as in IV = 5 - 1 = **4**. Adding them together would turn IV into 6, which is not how the system works.',
  'Which Roman numeral is not allowed to be repeated?':
    'Only I, X, C and M may repeat, so **V** is never written twice and 10 is X, not VV. Repeating V is exactly the mistake that turns 10 into VV.',
  '72 chairs are arranged in 8 equal rows. How many chairs are there in each row?':
    'Share 72 equally into 8 rows: 72 / 8 = **9 chairs**, since 8 x 9 = 72. The answer 8 just repeats the number of rows instead of dividing.',
  'Divide 47 by 5. Write the quotient and the remainder.':
    '5 x 9 = 45 and 47 - 45 = 2, so the quotient is **9** and the remainder is **2**. Giving 8 as the quotient leaves 7 over, which is more than the divisor 5.',
  'What is 23 × 3?':
    'Split 23 into 20 + 3: 20 x 3 = 60 and 3 x 3 = 9, and 60 + 9 = **69**. The answer 66 multiplies the tens correctly but forgets the 3 ones.',
  'Which of these is the same as 3 × 4?':
    'Multiplication works in either order, so 3 x 4 = 12 and 4 x 3 = **12**, the same product. Choosing 3 + 4 confuses multiplying with adding, which gives only 7.',
  'What is the remainder when 17 is divided by 5?':
    '5 x 3 = 15 and 17 - 15 = 2, so the remainder is **2**. Saying 3 leaves too much over, because a remainder must be less than the divisor 5.',
  'The remainder in a division must always be':
    'The remainder is what is left after as many whole groups as possible are taken out, so it must be **less than the divisor**. A remainder equal to the divisor would mean one more group could still be made.',
  'What is 23 x 4?':
    'Break 23 into 20 + 3: 20 x 4 = 80 and 3 x 4 = 12, and 80 + 12 = **92**. The answer 82 forgets the 1 carried over from 12.',
  'What is 84 divided by 4?':
    '4 x 20 = 80 and 4 x 1 = 4, so 84 / 4 = **21**. The answer 24 overshoots, because 4 x 24 = 96, which is 12 more than 84.',
  'What is 1 x 47?':
    'Multiplying by 1 leaves a number unchanged, so 1 x 47 = **47**. The answer 48 comes from adding one instead of multiplying by one.',
  'What is 0 x 56?':
    'Any number multiplied by zero gives zero, so 0 x 56 = **0**. The answer 56 forgets the zero and keeps the other number untouched.',
  'If 6 sweets are shared equally among 3 children, how many does each get?':
    'Six sweets into 3 equal shares is 6 / 3 = **2** sweets each. The answer 18 multiplies instead of dividing, working out 3 x 6.',
  'Division is the opposite of':
    'Dividing undoes multiplying, so 3 x 4 = 12 and 12 / 4 = 3, which makes **multiplication** the opposite. Subtraction is the opposite of addition, not of division.',
  'In the number 3,47,265, what is the place value of the digit 7?':
    'In 3,47,265 the 7 stands in the thousands place, so its value is 7 x 1000 = **7000**. The answer 700 counts the hundreds place, where the 2 sits.',
  'One lakh is the same as how many thousands?':
    'One lakh is 1,00,000 and one thousand is 1,000, so 1,00,000 / 1,000 = **100** thousands. The answer 1000 is ten times too big and would be ten lakh.',
  'Ravi has 3,684 stamps. He rounds the number to the nearest hundred. What number does he get?':
    'The hundreds digit is 6 and the tens digit is 8, which is 5 or more, so the number rounds up to **3,700**. The answer 3,600 rounds down, which only happens when the tens digit is under 5.',
  'A godown has 46,750 bags of rice and 28,340 bags of wheat. Estimate the total number of bags by rounding each number to the nearest thousand.':
    '46,750 rounds up to 47,000 and 28,340 rounds down to 28,000, so the estimate is 47,000 + 28,000 = **75,000** bags. Rounding 46,750 down to 46,000 would give 74,000, which is too low.',
  'What is the place value of 7 in 3,74,215?':
    'In the Indian grouping 3,74,215 the 7 sits in the ten-thousands place, so it is worth 7 x 10,000 = **70,000**. The answer 7,000 drops one place and counts thousands instead.',
  'How many thousands are there in 9,000?':
    '9,000 is 9 groups of one thousand, so it holds **9** thousands. The answer 900 counts tens instead of thousands, since 9,000 is 900 tens.',
  'In the Indian place value system, 1,00,000 is called':
    'After ten thousands comes **one lakh** at 1,00,000 in the Indian system. Calling it one million uses the international name, which belongs to 10,00,000.',
  'How many lakhs make one crore?':
    'One crore is 1,00,00,000 and one lakh is 1,00,000, so 1,00,00,000 / 1,00,000 = **100** lakhs. The answer 10 stops one zero short and describes ten lakh, not a crore.',
  'Round 4,678 to the nearest hundred.':
    'The hundreds digit is 6 and the tens digit is 7, which is 5 or more, so 4,678 rounds up to **4,700**. The answer 4,600 rounds down and ignores that 7 is past the halfway point.',
  'Round 2,351 to the nearest thousand.':
    'The thousands digit is 2 and the hundreds digit is 3, which is under 5, so the number stays at **2,000**. The answer 3,000 rounds up, which needs a hundreds digit of 5 or more.',
  'A shop sold 2,450 pens on Monday and 1,320 on Tuesday. How many pens were sold in all?':
    'Add the two amounts: 2,450 + 1,320 = 2,000 + 1,000 plus 450 + 320 = 770, so **3,770** pens. The answer 1,130 subtracts the smaller number instead of adding.',
  'A library had 5,000 books and gave away 1,250. How many books are left?':
    'Take 1,250 away from 5,000: 5,000 - 1,000 = 4,000 and 4,000 - 250 = **3,750** books. The answer 6,250 adds the two numbers instead of subtracting.',
  'What is 4567 + 2386?':
    'Add from the right: 7 + 6 = 13 (write 3, carry 1), 6 + 8 + 1 = 15, 5 + 3 + 1 = 9, 4 + 2 = 6, giving **6953**. The answer 6853 drops one carry from the hundreds column.',
  'Which of these number sentences shows that the order of the numbers does not change their sum?':
    'Swapping the addends keeps the total the same, since 256 + 148 and 148 + 256 both give 404, so **256 + 148 = 148 + 256** shows it. The sentence 256 + 0 = 256 shows the identity property, not swapping order.',
  'A factory makes 1,250 toys in one day. How many toys does it make in 6 days?':
    '1,250 x 6 = 6,000 + 1,500 = **7,500** toys, multiplying the thousands and the hundreds separately. The answer 7,050 comes from working out 250 x 6 as 1,050.',
  'Study the pattern: 7 × 1 = 7, 7 × 10 = 70, 7 × 100 = 700. What is 7 × 1000?':
    'Each extra zero in the multiplier adds one zero to the product, so 7 x 1000 = **7,000**. Stopping at 700 only multiplies by 100 and leaves the answer ten times too small.',
  'What is 1,234 + 2,468?':
    'Add by place: 4 + 8 = 12 (write 2, carry 1), 3 + 6 + 1 = 10, 2 + 4 + 1 = 7, 1 + 2 = 3, so **3,702**. The answer 3,602 forgets the carry from the tens column.',
  'What is 4,000 - 1,357?':
    'Regroup and subtract: 4,000 - 1,000 = 3,000 and 3,000 - 357 = **2,643**. The answer 2,743 is 100 too big, a slip when borrowing across the hundreds.',
  'Which property says 25 + 40 gives the same answer as 40 + 25?':
    'Changing the order of the addends and still getting the same sum is the **commutative property of addition**. The associative property is about regrouping three numbers, as in (25 + 40) + 5.',
  'What is 1,000 x 0?':
    'Any number multiplied by zero gives zero, so 1,000 x 0 = **0**. The answer 1,000 treats the zero like a one and leaves the number unchanged.',
  'A farmer packs 45 oranges in a box. How many oranges are in 12 boxes?':
    '45 x 12 = 45 x 10 + 45 x 2 = 450 + 90 = **540** oranges. The answer 450 multiplies by 10 only and forgets the extra 2 boxes.',
  '720 sweets are shared equally among 8 children. How many does each get?':
    '720 / 8 = **90** sweets each, because 8 x 90 = 720. The answer 9 is ten times too small, since 8 x 9 is only 72.',
  'What comes next: 100, 200, 300, 400, ___?':
    'Each number is 100 more than the one before, so 400 + 100 = **500**. The answer 410 adds only ten, reading the step as 10 instead of 100.',
  'What comes next: 1,000, 900, 800, ___?':
    'Each number is 100 less than the one before, so 800 - 100 = **700**. The answer 1,100 adds instead of subtracting and reverses the pattern.',
  'In the number 48,372, what is the place value of the digit 4?':
    'In 48,372 the 4 sits in the ten thousands column, so its value is 4 x 10,000 = **40,000**, with 8,372 filling the rest. Reading it as 4,000 moves the 4 one column to the right, into the thousands place that belongs to the 8.',
  'Which of these is the expanded form of 60,509?':
    '60,509 splits by place as 6 ten thousands, 0 thousands, 5 hundreds, 0 tens and 9 ones, which gives **60,000 + 500 + 9**. Writing 60,000 + 50 + 9 gives the 5 the value of 5 tens instead of 5 hundreds, and that total is only 60,059.',
  'Round 7,468 to the nearest hundred.':
    'The tens digit is 6, which is 5 or more, so the hundreds digit 4 rises to 5 and the tens and ones are cleared, making **7,500**. Rounding down instead gives 7,400, the slip of ignoring that the leftover 68 is closer to a full hundred than to zero.',
  'A number rounded to the nearest thousand is 5,000. Which of these could be the number?':
    'Every number from 4,500 to 5,499 rounds up to 5,000, and **4,512** sits inside that band because its hundreds digit is 5. The choice 4,499 fails the halfway test, since 499 is below 500 and the number rounds down to 4,000.',
  'Which number is written correctly with commas as seventy thousand forty?':
    'Seventy thousand forty has 7 in the ten thousands place, then 0 thousands, 0 hundreds, 4 tens and 0 ones, so it is **70,040**. The form 7,040 reaches only seven thousand and forty, because the 7 was placed one column too far right.',
  'What is 4,017 rounded to the nearest ten?':
    'The ones digit 7 is more than 5, so the tens digit 1 is raised to 2 and the ones place becomes 0, giving **4,020**. Writing 4,010 drops the 7 without carrying, which is the error of always rounding down whatever the ones digit is.',
  'In 47,382, the digit 4 is in the place value':
    'Reading right to left, 47,382 has 2 ones, 8 tens, 3 hundreds, 7 thousands and 4 ten thousands, so the 4 holds the **ten thousands** place. Calling it thousands would leave only four digits, which pushes every digit one column to the right.',
  'What is 10,000 + 3,000 + 400 + 5?':
    'Adding the parts in order gives 10,000 + 3,000 = 13,000, then 13,000 + 400 = 13,400, then + 5 = **13,405**. The answer 13,450 swaps the last two columns, which happens when the 5 is read as 50 instead of 5 ones.',
  'How is 45678 written with the Indian comma?':
    'In the Indian system the first comma comes after three digits from the right and every later comma covers two digits, so 45678 becomes **45,678**. The form 4,5678 puts a comma after a single digit, which neither the Indian nor the international system allows.',
  '45,678 is read as':
    'The number splits as 45 thousands, 6 hundreds and 78 ones, so it is read as **forty-five thousand six hundred seventy-eight**. Calling it four lakh fifty-six thousand treats the leading two digits as a lakh, a place that needs six digits before the comma.',
  'What is the expanded form of 5,406?':
    '5,406 holds 5 thousands, 4 hundreds, 0 tens and 6 ones, so the expansion is **5000 + 400 + 6**. The form 5000 + 40 + 6 gives 5,046, because it moves the 4 out of the hundreds column into the tens column.',
  '8000 + 200 + 30 + 4 equals':
    'The four addends fill the thousands, hundreds, tens and ones columns with 8, 2, 3 and 4, giving **8,234**. Writing 8,243 puts the 3 in the ones column and the 4 in the tens, so it swaps the last two digits.',
  'Round 4,367 to the nearest ten.':
    'The ones digit is 7, so the tens digit 6 is increased by one and the ones place is cleared, making **4,370**. Stopping at 4,360 means rounding down even though 7 is past the halfway point of 5.',
  'Round 82 to the nearest ten.':
    'The ones digit 2 is less than 5, so the tens digit stays at 8 and the ones place becomes 0, giving **80**. Rounding up to 90 is only right when the ones digit is 5 or more, as it is in 85.',
  'Round 5,672 to the nearest hundred.':
    'The tens digit 7 is 5 or more, so the hundreds digit 6 rises to 7 and the tens and ones are cleared, making **5,700**. Keeping the 6 and writing 5,600 is rounding down, which needs a tens digit below 5.',
  'Round 349 to the nearest hundred.':
    'The tens digit 4 is less than 5, so the hundreds digit 3 stays and the rest of the number becomes zero, giving **300**. Bumping it up to 400 would require the number to be 350 or more.',
  'Round 7,450 to the nearest thousand.':
    'The hundreds digit is 4, which is below 5, so the thousands digit 7 is kept and the rest is cleared, giving **7,000**. The answer 8,000 comes from rounding up, a step that belongs only to hundreds digits of 5 or more.',
  'Round 9,800 to the nearest thousand.':
    'The hundreds digit 8 is 5 or more, so the thousands digit 9 rises to 10 and the number becomes **10,000**. Leaving it at 9,000 loses the carry, the same slip that turns 950 into 900 rather than 1,000.',
  'Which of these is a unit fraction?':
    'A unit fraction always carries 1 as its numerator, and **1/7** is the only choice with 1 on top. The fraction 2/7 shades two of the seven parts, so it is two unit fractions joined rather than one.',
  'Which fraction is equivalent to 3/4?':
    'Multiplying the top and bottom of 3/4 by 3 gives 9 and 12, so **9/12** names the same amount. The fraction 12/14 reduces to 6/7, not 3/4, because 12 and 14 share only the factor 2.',
  'Write 17/5 as a mixed number.':
    'Five goes into 17 three times, using 15 fifths and leaving 2 over, so 17/5 = **3 2/5**. Stopping at 2 2/5 is one whole short, since that mixed number is worth only 12 fifths.',
  'Riya ate 3/8 of a cake and Meera ate 3/5 of an identical cake. Who ate more?':
    'With equal numerators the smaller denominator wins, so 3/5 = 0.6 beats 3/8 = 0.375 and **Meera** ate more. Picking Riya comes from reading 8 as the bigger number and assuming a bigger denominator means a bigger share.',
  'Which comparison is correct?':
    'Both fractions are counted in eighths, so compare the numerators: 5 eighths is more than 3 eighths, giving **5/8 > 3/8**. The claim 5/8 < 3/8 turns the sign round, as if a larger numerator made a smaller fraction.',
  'Which of these fractions is greater than 1?':
    'A fraction beats 1 only when its numerator is larger than its denominator, and **5/3** is the only choice that does it, being about 1.67. The fraction 6/8 stays below 1 because 6 is smaller than 8, so it is less than a whole.',
  'Which mixed number is the same as 9/4?':
    'Four goes into 9 twice, using 8 quarters and leaving 1, so 9/4 = **2 1/4**. The answer 1 1/4 is worth only 5 quarters, which forgets that each whole uses up 4 of them.',
  'Which fraction is equivalent to 1/3?':
    'Multiplying the top and bottom of 1/3 by 2 gives 2 and 6, so **2/6** is the same share. The fraction 1/6 keeps the numerator at 1 while doubling the denominator, which halves the piece to one sixth.',
  'Which fraction is equivalent to 2/4?':
    'Dividing the top and bottom of 2/4 by 2 gives 1 and 2, so **1/2** is the same amount, exactly half. The choice 1/4 is half the size of 2/4 rather than equal to it, because only the numerator was halved.',
  'A unit fraction has numerator':
    'A unit fraction is a single part of a whole, so its numerator is **1** and only the denominator changes. Saying the numerator matches the denominator describes a whole such as 5/5, not one part of it.',
  'Which is a unit fraction?':
    'The numerator must be 1, and **1/7** is the only option with 1 on top. The fraction 7/3 has 7 as its numerator and is improper, worth more than a whole, so it cannot be a single unit part.',
  'Which is larger: 3/8 or 5/8?':
    'Both fractions are measured in eighths, so the larger numerator gives the larger fraction, and **5/8** wins. Choosing 3/8 treats the smaller numerator as bigger, which reverses the comparison.',
  'With the same denominator, the larger fraction has the':
    'A fixed denominator means every part is the same size, so taking more parts gives a bigger fraction, hence the **larger numerator**. A smaller numerator gives fewer parts, and 2/9 is clearly less than 7/9.',
  'Which is larger: 2/3 or 2/7?':
    'With 2 parts of each, thirds are bigger pieces than sevenths, so **2/3** is larger at about 0.67 against 0.29. Picking 2/7 comes from treating 7 as the bigger number and assuming it makes a bigger fraction.',
  'With the same numerator, the larger fraction has the':
    'The same number of parts cut into smaller pieces makes a smaller fraction, so a fixed numerator needs the **smaller denominator** to be larger. Assuming a bigger denominator helps is the usual trap, since 2/3 beats 2/10.',
  'An improper fraction has a numerator':
    'An improper fraction is worth one whole or more, so its numerator is **greater than or equal to** its denominator, as in 6/6 or 9/4. A numerator smaller than the denominator describes a proper fraction, which always stays below 1.',
  '9/4 written as a mixed number is':
    'Dividing 9 by 4 gives 2 wholes and a remainder of 1, so 9/4 = **2 1/4**. Saying 2 3/4 leaves a remainder of 3, which would need 11 quarters in total.',
  '3 1/2 as an improper fraction is':
    'Multiply the whole 3 by the denominator 2 to get 6, then add the numerator 1 for 7 halves, so 3 1/2 = **7/2**. Writing 5/2 drops the extra half, since 3 wholes alone already make 6/2.',
  'How many right angles make one full turn?':
    'A full turn is 360 degrees and a right angle is 90 degrees, so 360 / 90 = 4, meaning **4** right angles fit in one full turn. The answer 2 describes a half turn, where only 180 degrees is covered.',
  'An eighth of a turn measures how many degrees?':
    'A full turn is 360 degrees, and 360 / 8 = 45, so an eighth of a turn is **45 degrees**. The value 90 degrees is a quarter turn, which is 360 / 4 and twice as large.',
  'An angle measures 120°. Is it acute, right or obtuse?':
    'An angle lying between 90 and 180 degrees is obtuse, and 120 falls in that range, so it is **obtuse**. Calling it acute ignores the 90 degree limit, because acute angles stop below a right angle.',
  'The minute hand of a clock turns from 12 to 7. What angle does it turn through?':
    'From 12 to 7 the hand passes 7 hour marks, and each mark is 360 / 12 = 30 degrees, so 7 x 30 = **210 degrees**. The answer 150 degrees counts only 5 marks, as if the hand had gone the short way from 7 back to 12.',
  'Reema makes two half turns in the same direction. Together they make one ___.':
    'One half turn is 180 degrees, so two of them add to 180 + 180 = 360 degrees, which is exactly one **full turn**. Calling it a quarter turn would cover only 90 degrees, a single right angle.',
  'You are facing North and make a quarter turn clockwise. Which direction are you facing now?':
    'A quarter turn clockwise moves North on to East, because the clockwise order runs North, East, South, West, so you now face **East**. Choosing West applies the turn anticlockwise, which is the opposite direction.',
  'You are facing East and make a quarter turn anti-clockwise. Which direction are you facing now?':
    'Turning back against the clockwise order from East lands on North, since clockwise runs North, East, South, West, so the new facing is **North**. Answering South would be a clockwise quarter turn, the opposite sense.',
  'A quarter turn makes an angle of':
    'A full turn is 360 degrees, so a quarter of it is 360 / 4 = **90 degrees**, the size of a right angle. The value 180 degrees is a half turn, twice as much as a quarter.',
  'A right angle is also called':
    'A right angle measures 90 degrees, which is one quarter of the 360 degree full turn, so it is **a quarter turn**. A half turn is 180 degrees, double the size of a right angle.',
  'A full turn is':
    'Turning all the way round until you face the starting way again sweeps 4 right angles, and 4 x 90 = **360 degrees**. The value 180 degrees is only halfway round, where you would end up facing backwards.',
  'How many degrees are there in a half turn?':
    'A half turn is half of the 360 degree full turn, and 360 / 2 = **180 degrees**, the angle of a straight line. The value 90 degrees is a quarter turn, half of a half turn.',
  'An acute angle is':
    'Acute angles are the sharp ones that open less than a right angle, so they measure **less than 90 degrees**. The description between 90 and 180 degrees belongs to an obtuse angle instead.',
  'An obtuse angle is':
    'An obtuse angle is wider than a right angle yet still short of a straight line, so it measures **between 90 and 180 degrees**. Naming less than 90 degrees describes an acute angle, the opposite case.',
  'One eighth of a turn is':
    'A full turn of 360 degrees cut into 8 equal parts gives 360 / 8 = **45 degrees** for each part. The value 30 degrees is one twelfth of a turn, which would need 12 equal parts.',
  'How many eighths make a full turn?':
    'Eighths are made by cutting a full turn into 8 equal parts, so all **8** of them fit back together to rebuild the whole turn. The answer 4 counts quarter turns, each worth 90 degrees.',
  'In one hour the minute hand turns through':
    'The minute hand takes exactly 60 minutes to travel once round the face, so in one hour it makes **a full turn** of 360 degrees. Saying a quarter turn would mean it moved only from 12 round to 3 in that hour.',
  'From 12 to 3 the hour hand turns through':
    'The hour hand covers 12 hours in a full turn, so 3 hours is 3/12 = 1/4 of it, which is **a quarter turn**. Calling it an eighth turn would fit only 1.5 hours, half the gap from 12 to 3.',
  'The hands of a clock move':
    'The hands travel 12, 1, 2, 3 and onward, the very direction the word clockwise comes from, so they move **clockwise**. Saying anticlockwise would send the hands backwards from 12 towards 11.',
  'What is 2,468 + 3,575?':
    'Add column by column with carrying: 8 + 5 = 13 (write 3, carry 1), 6 + 7 + 1 = 14 (write 4, carry 1), 4 + 5 + 1 = 10 (write 0, carry 1), so the total is **6,043**. Forgetting the carry from the ones column gives 6,053, a full ten too small.',
  'What is 4,325 − 99?':
    'Subtracting 99 is easiest as subtracting 100 and adding 1 back: 4,325 - 100 = 4,225, then 4,225 + 1 = **4,226**. Adding the 1 without ever taking away the 100 leaves 4,326, which is larger than the number you started with.',
  'Find the sum of the five consecutive numbers 11, 12, 13, 14 and 15.':
    'Pair the ends so the adding is quick: 11 + 15 = 26 and 12 + 14 = 26, then add the middle number, 26 + 26 + 13 = **65**. Leaving out that middle 13 while pairing only the four outer numbers gives 52.',
  'The sum of three consecutive odd numbers is 63. What is the largest of them?':
    'Start from the middle number: 63 / 3 = 21, so the three consecutive odd numbers are 19, 21 and 23 and the largest is **23**. Stopping at 21 answers with the middle number instead of the biggest one.',
  'What is 5,423 - 1,786?':
    'Work right to left with borrowing: 13 - 6 = 7 ones, 11 - 8 = 3 tens, 13 - 7 = 6 hundreds, 4 - 1 = 3 thousands, giving **3,637**. Skipping the borrow in the hundreds column makes the total 3,737, a hundred too high.',
  'A student finds that 7,000 - 2,468 = 4,532. Which addition correctly checks this subtraction?':
    'The difference plus the number that was taken away must rebuild the whole, so **4,532 + 2,468 = 7,000** is the correct check. Subtracting 2,468 from 4,532 only compares the two parts and can never rebuild 7,000.',
  'If 500 - 180 = 320, how do you check it?':
    'Adding the difference back to the number subtracted must return the starting number: 320 + 180 = **500**, so the subtraction is right. Putting 500 + 180 together mixes up which number is the whole and which is the part.',
  'To check a subtraction, add the answer to the':
    'The difference plus the number taken away rebuilds the original total: 500 - 180 = 320 is checked by 320 + 180 = **500**. Doubling the answer, or adding it to zero, never brings back the number you started with.',
  'What is 4,678 + 2,845?':
    'Carry as you go: 8 + 5 = 13 (3, carry 1), 7 + 4 + 1 = 12 (2, carry 1), 6 + 8 + 1 = 15 (5, carry 1), 4 + 2 + 1 = 7, so **7,523**. Losing the carry from the hundreds column makes the total 7,423, a hundred short.',
  'Regrouping is needed when a column adds up to':
    'A column that reaches 10 or more overflows its place, so ten of that place are exchanged for one of the next place: that is **regrouping**. A column that adds to zero needs no regrouping at all, so confusing the two sends the carry the wrong way.',
  'What is 4 + 5 + 6?':
    'Add in two steps: 4 + 5 = 9, then 9 + 6 = **15**. Adding only the 4 and the 6 and silently skipping the middle addend gives 10, a whole number short of the total.',
  'The sum of 10, 11 and 12 is':
    'Add the first two and then the third: 10 + 11 = 21 and 21 + 12 = **33**, and the middle-number trick 3 x 11 = 33 agrees. Multiplying 12 by 3 instead of adding the three numbers gives 36.',
  'What is 6,000 - 2,475?':
    'Borrow down the line: 10 - 5 = 5 ones, 9 - 7 = 2 tens, 9 - 4 = 5 hundreds and 5 - 2 = 3 thousands, so **3,525**. Forgetting that the thousands place lent a thousand leaves 4,525, a thousand too big.',
  'When a digit is too small to subtract, we':
    'One unit of the next higher place is worth ten of the current place, so the digit takes that unit: we **borrow from the next place**. Writing zero when the top digit is smaller destroys the value of the column instead of increasing it.',
  'What is 450 - 99?':
    'Subtract 100 and add the extra 1 back: 450 - 100 = 350 and 350 + 1 = **351**. Taking 100 and then 1 more, as though 101 had been removed, gives 349.',
  'Subtracting 9 is the same as subtracting 10 and then':
    '9 is one less than 10, so taking 10 away takes one too many and **adding 1** restores it: 450 - 10 = 440, then 440 + 1 = 441. Subtracting 1 as well removes 11 in total instead of 9.',
  'Which number is odd?':
    'A number is odd when it leaves a remainder of 1 on halving, and 47 = 2 x 23 + 1, so **47** is the odd one. Calling 48 odd is a misread, because 48 halves exactly into 24.',
  'An even number always ends in':
    'Halving an even number leaves no remainder, which happens only when the last digit is **0, 2, 4, 6 or 8**. The digits 1, 3, 5, 7 and 9 mark odd numbers, so listing those reverses the rule.',
  'How many centimetres are there in 6 metres?':
    'One metre holds 100 centimetres, so 6 m = 6 x 100 = **600 cm**. Multiplying by 1,000 as though metres were kilometres turns it into 6,000 cm, ten times too large.',
  'Add: 3 km 450 m and 2 km 700 m.':
    'Add the like parts: 3 km + 2 km = 5 km and 450 m + 700 m = 1,150 m, which is 1 km 150 m, so the total is **6 km 150 m**. Leaving the metres at 1,150 m without regrouping them into a kilometre is the slip.',
  'A rope is 8 m 25 cm long. If 3 m 40 cm is cut off, how much rope is left?':
    'Borrow a metre as 100 cm: 8 m 25 cm becomes 7 m 125 cm, and 7 m 125 cm - 3 m 40 cm = **4 m 85 cm**. Taking 25 - 40 the wrong way round would give 15 cm and hide the borrow completely.',
  'Each step of a child is 45 cm long. How far does the child walk in 40 steps? Give the answer in metres.':
    'Multiply the step length by the count: 45 x 40 = 1,800 cm, and 1,800 / 100 = **18 m**. Reading 1,800 cm as 1 m 80 cm divides by 1,000 instead of 100.',
  'How many metres are there in 4 kilometres?':
    'One kilometre is 1,000 metres, so 4 km = 4 x 1,000 = **4,000 m**. Using 100 m for a kilometre gives 400 m, ten times too small for four kilometres.',
  'How many millimetres are there in 6 cm 5 mm?':
    'One centimetre is 10 millimetres, so 6 cm = 60 mm and 60 + 5 = **65 mm**. Treating a centimetre as 100 mm turns 6 cm into 600 mm and tips the total to 605 mm.',
  'A road 12 km 600 m long is built in 6 days, with the same length built each day. How much road is built each day?':
    'Change to one unit first: 12 km 600 m = 12,600 m, and 12,600 / 6 = 2,100 m, which is **2 km 100 m**. Dropping a zero and writing 2 km 10 m makes one day\'s road ten times too short.',
  '250 cm is the same as':
    'Every 100 cm makes one metre, so 250 cm = 2 m with 50 cm over, that is **2 m 50 cm**. Calling it 25 m counts 10 cm to a metre instead of 100.',
  'How many millimetres make one centimetre?':
    'A centimetre is split into ten equal millimetres, so 1 cm = **10 mm**. The 1,000 mm figure belongs to a metre, and mixing the two units inflates the answer a hundred times.',
  'What is 2 km 300 m + 1 km 400 m?':
    'Add like parts: 2 km + 1 km = 3 km and 300 m + 400 m = 700 m, so the total is **3 km 700 m** with nothing to regroup. Adding an extra kilometre for no reason gives 4 km 700 m.',
  'When adding lengths, first convert both to':
    'Lengths in different units cannot be added column by column, so both must first be changed into **the same unit**. Converting to metres and centimetres keeps two units and leaves the original problem unsolved.',
  'What is 5 km 200 m - 1 km 800 m?':
    'Borrow one kilometre as 1,000 m: 5 km 200 m = 4 km 1,200 m, then 4 km 1,200 m - 1 km 800 m = **3 km 400 m**. Taking 1,200 - 800 without giving back the borrowed kilometre leaves 4 km 400 m.',
  'To subtract 1 m 40 cm from 3 m, you borrow':
    'There are no centimetres in 3 m, so one metre is exchanged for 100 cm, making 2 m 100 cm - 1 m 40 cm = 1 m 60 cm by taking **100 cm from the metres**. Borrowing only 10 cm leaves too little to subtract 40 cm.',
  'What is 3 m 25 cm x 4?':
    'Multiply the parts separately: 3 m x 4 = 12 m and 25 cm x 4 = 100 cm = 1 m, so the answer is **13 m**. Writing 12 m 100 cm keeps the extra 100 cm instead of regrouping it into a metre.',
  'What is 2 m 50 cm x 2?':
    'Double each part: 2 m x 2 = 4 m and 50 cm x 2 = 100 cm = 1 m, giving 4 m + 1 m = **5 m**. Doubling only the metres and copying the 50 cm unchanged gives 4 m 50 cm.',
  'What is 8 m 40 cm divided by 4?':
    'Divide the metres and the centimetres separately: 8 m / 4 = 2 m and 40 cm / 4 = 10 cm, so **2 m 10 cm**. Dividing the 8 by 4 but leaving the 40 cm whole gives 2 m 40 cm.',
  'What is 9 m divided by 3?':
    'Share the metres equally: 9 / 3 = 3, so each share is **3 m**. Multiplying instead of dividing gives 27 m, the wrong operation for a sharing problem.',
  '3 m 45 cm is the same as':
    'Turn the metres into centimetres: 3 m = 300 cm, and 300 + 45 = **345 cm**. Writing 3,450 cm treats a metre as 1,000 cm instead of 100, so the place values jump.',
  'What is 47 × 100?':
    'Multiplying by 100 moves every digit two places to the left, so 47 becomes **4,700**. Shifting three places, as though the multiplier were 1,000, gives 47,000.',
  'What is 36 × 1,000?':
    'Each zero in the multiplier adds a zero to the product, so 36 x 1,000 = **36,000**. Adding only two zeros gives 3,600, as though the multiplier were 100.',
  'Use doubling and halving to find 25 × 16.':
    'Halve 16 and double 25 step by step: 8 with 50, then 4 with 100, then 2 with 200, then 1 with 400, so 25 x 16 = **400**. Stopping one step early leaves 200, exactly half the true product.',
  'A milk van carries cans of 24 litres each. 17 cans hold 408 litres. Which is the nearest multiple of 10 to this amount?':
    '408 is 2 away from **410** and 8 away from 400, so 410 is the nearer multiple of 10. Choosing 420 sits 12 away, treating the next ten above as nearest just because it is larger.',
  'Using place value, what is 6 x 342?':
    'Split 342 into 300, 40 and 2: 6 x 300 = 1,800, 6 x 40 = 240 and 6 x 2 = 12, so 1,800 + 240 + 12 = **2,052**. Losing the ten carried from 6 x 42 = 252 lowers the total to 2,042.',
  'If 16 x 44 = 704, what is 32 x 44?':
    '32 is twice 16, so the product doubles too: 704 x 2 = **1,408**. Quadrupling instead of doubling gives 2,816, which is twice as big as it should be.',
  'Using the pattern shown by 11 x 12 = 132, 11 x 34 = 374 and 11 x 56 = 616, find 11 x 54.':
    'Multiplying by 11 puts the sum of the digits between them: for 54 the outer digits are 5 and 4, their sum is 9, so 11 x 54 = **594**. Reversing the digits to read 549 ignores place value, and 11 x 50 alone is already 550.',
  'What is 46 x 10?':
    'Every digit moves one place left when you multiply by 10, so 46 becomes **460**. Adding two zeros, as though multiplying by 100, gives 4,600.',
  'Multiplying by 100 adds':
    'Since 100 = 10 x 10, two shifts of one place each add **two zeros** to the product. Adding three zeros treats 100 as 1,000 and makes the answer ten times too big.',
  'What is 27 x 1,000?':
    'The three zeros of 1,000 are copied onto 27, giving **27,000**. Writing 2,700 copies only two zeros, as though the multiplier were 100 instead of 1,000.',
  'What is 500 x 1,000?':
    'Break 500 into 5 x 100, so the product is 5 x 100 x 1,000 = 5 x 100,000 = **500,000**. Answering 50,000 drops one of the zeros that 1,000 contributes, making it ten times too small.',
  'What is double of 175?':
    'Doubling means adding the number to itself: 175 + 175 = **350**. Reaching only 275 by adding 100 fails to double the tens and the ones as well as the hundreds.',
  'Half of 96 is':
    'Halving 96 gives 48 because 48 + 48 = 96, so the half is **48**. Writing 46 slips on the ones digit, while 192 is the double rather than the half.',
  'The nearest multiple of 10 below 47 is':
    'The multiples of 10 on either side of 47 are 40 and 50, and 40 is the one **below** 47. Choosing 50 answers the nearest multiple overall, which lies above the number.',
  'The nearest multiple of 100 above 250 is':
    'The multiples of 100 are 200, 300, 400 and so on, and the first one greater than 250 is **300**. Picking 200 looks downward, even though 200 is smaller than 250.',
  'What is 23 x 4 using place value?':
    'Split 23 into 20 + 3: 20 x 4 = 80 and 3 x 4 = 12, so **80 + 12 = 92**. Multiplying the tens by 4 but leaving the 3 unchanged gives 80 + 4 = 84.',
  'In 34 x 5, the tens part gives':
    'The 3 in 34 is worth thirty, so the tens part is **30 x 5 = 150**, and the ones part 4 x 5 = 20 makes 170 in all. Reading the 3 as three makes the tens part 15, ten times too small.',
  'If 6 x 7 = 42, then 60 x 7 =':
    '60 is ten times 6, so 60 x 7 is ten times 42, which is **420**. Making it 4,200 multiplies by a hundred, as though 60 were a hundred times 6.',
  'How many sides does a regular hexagon have?':
    'The prefix hex- means six, so a **regular hexagon** has 6 equal sides and 6 equal angles, just as six cells meet around a point in a honeycomb. Counting 7 or 8 confuses hexagon with heptagon or octagon, whose names mean seven and eight.',
  'Which of these shapes does NOT tessellate on its own?':
    'A **circle** has a curved edge, so however you pack them they touch at single points and leave curved gaps between them. Squares, triangles and regular hexagons each fit around a point to exactly 360 degrees, so choosing one of them ignores the gaps a circle leaves.',
  'An isosceles triangle has two equal sides of 7 cm each and a third side of 4 cm. What is its perimeter?':
    'Add all three sides: 7 + 7 + 4 = 18, so the **perimeter** of the triangle is 18 cm. Leaving out one of the two equal 7 cm sides gives 11 cm, the slip that makes the answer too small.',
  'A tile pattern starts with 5 tiles in the first row and adds 3 tiles for every new row. How many tiles are in the 10th row?':
    'Row n holds 5 + 3(n - 1) tiles, so row 10 holds 5 + 3 x 9 = 5 + 27 = **32** tiles. Adding 3 ten times instead of nine times gives 35, which counts a row 0 that does not exist.',
  'A mat is woven with the rule \'2 over, 1 under\' repeated. How many of the first 9 strips are woven \'over\'?':
    'Each block of 3 strips is 2 over and 1 under, so 9 strips make 3 blocks and 3 x 2 = **6** over strips. Reading the rule backwards as 1 over and 2 under flips the count to 3.',
  'Which statement is true for a kite?':
    'A **kite** has two pairs of equal sides that meet at the two ends of its long diagonal, which is why that diagonal folds the shape in half. Expecting all four sides to be equal describes a rhombus, which is not every kite.',
  'A quadrilateral in which both pairs of opposite sides are equal is called a ___.':
    'When both pairs of opposite sides are equal the shape also has both pairs parallel, and that is exactly a **parallelogram**. A kite has equal sides only where they touch, so it cannot satisfy the opposite-side condition.',
  'A repeating pattern in weaving uses':
    'A **repeating pattern** copies one fixed over-under unit along the mat, so the same sequence returns in the same position again and again. Random threads or a single colour remove the repetition that a pattern needs.',
  'Which unit repeats in the pattern AAB AAB AAB?':
    'The string splits as AAB | AAB | AAB, so the **repeating unit** is the three-letter block AAB. Taking AB as the unit ignores the doubled A and would print A B A B A B instead.',
  'In the pattern 3, 6, 9, 12, the rule is':
    'Each term is 3 more than the one before: 3 + 3 = 6, 6 + 3 = 9 and 9 + 3 = **12**. Doubling fails at the second step, because 6 doubled is 12 and not 9.',
  'In the pattern 1, 2, 4, 8, the rule is':
    'Every term is twice the previous one: 1 x 2 = 2, 2 x 2 = 4 and 4 x 2 = **8**. Adding 2 each time matches 2 and 4 by accident but would give 6 next instead of 8.',
  'A regular shape has':
    'A shape is **regular** only when every side has the same length and every angle has the same size, so it looks unchanged after a turn. Having just two equal sides describes an isosceles triangle, a weaker and different condition.',
  'Which is a regular shape?':
    'An **equilateral triangle** has three equal sides and three equal 60 degree angles, so it satisfies both parts of regularity. A rectangle has equal angles but two long and two short sides, so its sides are not all equal.',
  'Tessellation means shapes fit together':
    'A **tessellation** covers the surface completely, so the shapes meet edge to edge with no gaps left and no area counted twice. Allowing small gaps breaks the tiling, because the pieces then do not fill the region.',
  'Which shape does NOT tessellate by itself?':
    'A **circle** touches its neighbours only at single points, so curved gaps always remain between packed circles. Triangles, squares and hexagons fit around a point to exactly 360 degrees, which is why each can tile alone.',
  'An isosceles triangle has':
    'An **isosceles triangle** has exactly two sides of equal length, and the angles opposite those equal sides are equal too. Three equal sides makes the triangle equilateral, a stronger condition than isosceles.',
  'In a parallelogram, opposite sides are':
    'In a **parallelogram** both pairs of opposite sides are equal in length and run parallel, which lets the shape slide onto itself when shifted. Sides that are equal but not parallel buckle the figure into a kite or a trapezium.',
  'How many equal sides does an isosceles triangle have?':
    'An **isosceles triangle** has exactly two equal sides, and they sit opposite the two equal base angles. Replying three describes an equilateral triangle, which has one more equal side.',
  'How many grams are there in 4 kilograms?':
    'Because 1 kg = 1000 g, the conversion is 4 x 1000 = **4000 g**. Adding one zero instead of three gives 400, a place-value slip that makes the mass ten times too small.',
  'A jug has 2 L 250 mL of juice. 750 mL is poured out. How much juice is left?':
    'Change to one unit first: 2250 mL - 750 mL = 1500 mL, which is **1 L 500 mL**. Borrowing a litre but subtracting the 750 from that litre alone (1000 - 750 = 250) loses the extra 250 mL and gives 1 L 250 mL.',
  'A bag of rice weighs 5 kg. What is the total weight of 8 such bags?':
    'Multiply the mass of one bag by the number of bags: 5 x 8 = **40 kg**. Adding 5 and 8 instead of multiplying gives 13 kg, treating repeated weight as a single sum.',
  'A truck carries 2 tonnes 500 kg of sand and unloads 1 tonne 750 kg. How much sand remains?':
    'Write both loads in kilograms: 2500 - 1750 = **750 kg** left on the truck. Treating a tonne as 100 kg instead of 1000 kg keeps 1 tonne 750 kg, which is far too much sand.',
  'A rice sack weighs 9 kg 750 g. After some rice is used, it weighs 3 kg 700 g. How much rice was used?':
    'Subtract like units: 750 g - 700 g = 50 g and 9 kg - 3 kg = 6 kg, so **6 kg 50 g** was used. Reading 50 g as 500 g pads the answer to 6 kg 500 g, a tenths-place error.',
  'What is 2 kg 500 g + 1 kg 750 g?':
    'Add the grams first: 500 + 750 = 1250 g, which is 1 kg 250 g, so the kilograms become 2 + 1 + 1 = 4 and the total is **4 kg 250 g**. Dropping the carried kilogram gives 3 kg 250 g.',
  'How many millilitres are there in 3 litres?':
    'One litre holds 1000 mL, so 3 litres hold 3 x 1000 = **3000 mL**. Using 100 mL per litre gives 300 mL, a hundredfold error in the conversion.',
  'What is 2 l 500 ml + 2 l 800 ml?':
    'Add the millilitres: 500 + 800 = 1300 mL, which is 1 L 300 mL, so the litres total 2 + 2 + 1 = 5 and the sum is **5 L 300 mL**. Forgetting to carry the litre keeps the answer at 4 L 300 mL.',
  'How many grams make one kilogram?':
    'The metric system sets **1 kilogram = 1000 grams**, which is why a 1 kg sugar pack is printed as 1000 g. Using 100 g would make a kilogram a hundred times too light.',
  '2 kg 250 g is the same as':
    'Two whole kilograms are 2 x 1000 = 2000 g, and 2000 + 250 = **2250 g**. Writing the 250 straight after the 2 as 2025 g treats grams as extra digits of the kilograms.',
  'One tonne equals':
    'A **tonne** is 1000 kilograms, which is why lorry loads are quoted in tonnes rather than in kilograms. Choosing 1000 grams mistakes the tonne for the kilogram.',
  'Which unit is used for very light things like medicine?':
    'A **milligram** is one thousandth of a gram, so it suits the tiny doses printed on a medicine strip. A litre measures volume rather than mass, so it cannot weigh a tablet.',
  'What is 3 kg 400 g + 2 kg 700 g?':
    'Add the grams: 400 + 700 = 1100 g, which is 1 kg 100 g, so the kilograms total 3 + 2 + 1 = 6 and the sum is **6 kg 100 g**. Ignoring the carry leaves 5 kg 100 g, one whole kilogram short.',
  'What is 1 kg 500 g x 3?':
    'Multiply each part by 3: 1 kg x 3 = 3 kg and 500 g x 3 = 1500 g = 1 kg 500 g, so the total is **4 kg 500 g**. Multiplying only the kilograms and leaving 500 g untouched gives 3 kg 500 g.',
  'What is 6 kg divided by 4?':
    'Six kilograms is 6000 g, and 6000 / 4 = 1500 g, which is **1 kg 500 g**. Rounding the divisor to 3 would give 2 kg, too large for the same mass.',
  'How many millilitres make one litre?':
    'A **litre** is defined as 1000 millilitres, so a 1 L bottle holds 1000 mL and 1000 mL fills it exactly. Using 100 mL makes the litre only a tenth of its real size, the same error as reading 1 kg as 100 g.',
  'What is 2 L 300 mL + 1 L 900 mL?':
    'Add the millilitres: 300 + 900 = 1200 mL, which is 1 L 200 mL, so the litres total 2 + 1 + 1 = 4 and the sum is **4 L 200 mL**. Copying the 1200 across as 120 mL gives the stray 4 L 120 mL.',
  'What is 5 L 600 mL - 2 L 800 mL?':
    'Borrow one litre as 1000 mL: 5600 - 2800 = 2800 mL, which is **2 L 800 mL**. Subtracting 600 from 800 to get 200 and then keeping 3 litres gives the 3 L 200 mL slip.',
  'What is 3,600 ÷ 100?':
    'Dividing by 100 removes two zeros, so 3600 / 100 = **36**, because 100 x 36 = 3600 checks out. Removing only one zero gives 360, which is dividing by 10 instead of 100 and leaves the answer ten times too big.',
  'Since 9 × 7 = 63, what is 63 ÷ 9?':
    'Division undoes multiplication, so the missing factor that multiplies 9 to give 63 is **7**. Answering 9 copies the divisor instead of finding the number of groups.',
  'Divide 47 by 5. Give the quotient and the remainder.':
    'Nine fives are 45 and 47 - 45 = 2, so the **quotient is 9 with remainder 2**. Stopping at 8 leaves 7 over, which still contains a full group of 5.',
  'Using splitting, 96 ÷ 8 is worked out as (80 ÷ 8) + (16 ÷ 8). What is the answer?':
    '80 / 8 = 10 and 16 / 8 = 2, so the split sum is 10 + 2 = **12**, and 8 x 12 = 96 checks it. Swapping in 88 / 8 = 11 and then adding 2 overshoots to 13.',
  'In 45 / 9 = 5, which number is the divisor?':
    'The **divisor** is the number you divide by, here 9, so 45 / 9 = 5 means 45 splits into five groups of 9. Choosing 45 names the dividend, the number being divided.',
  'A number divided by 7 gives 8. What is the number?':
    'Reverse the division with multiplication: 7 x 8 = **56**, and 56 / 7 = 8 checks it. Adding 7 and 8 to get 15 uses the wrong operation, because the whole before sharing is wanted.',
  'What is 4,200 / 60?':
    'Cancel one zero from each number: 4200 / 60 = 420 / 6 = **70**, since 60 x 70 = 4200. Cancelling both zeros and dividing 42 by 6 gives 7, ten times too small.',
  'If 6 x 8 = 48, then 48 divided by 6 is':
    'Since 6 x 8 = 48, splitting 48 into 6 equal groups puts **8** in each group. Answering 6 repeats the divisor rather than the missing factor.',
  'Division and multiplication are':
    'Multiplication builds a total from equal groups and division splits that total back again, so the two are **inverse operations**. Calling them the same ignores that one makes the number larger and the other smaller.',
  'In 56 divided by 7 = 8, the dividend is':
    'The **dividend** is the number being divided, here 56, which is shared into groups of 7. Choosing 8 names the quotient, the size of each group.',
  'What is 450 divided by 10?':
    'Dividing by 10 removes one zero, so 450 / 10 = **45**, which 10 x 45 = 450 confirms. Multiplying instead gives 4500, ten times too large for the same number.',
  'What is 3,000 divided by 100?':
    'Dividing by 100 removes two zeros, so 3000 / 100 = **30**, since 100 x 30 = 3000. Removing a single zero gives 300, as if the divisor were 10 and not 100.',
  'What is 84 divided by 4 using place value?':
    'Split 84 by place value: 80 / 4 = 20 and 4 / 4 = 1, so 20 + 1 = **21**. Dividing the 4 by 1 instead of by 4 turns the parts into 20 + 4 = 24.',
  'To divide 96 by 3, split 96 into':
    'Splitting 96 by place value gives 90 + 6, and 90 / 3 = 30 with 6 / 3 = 2 gives **32**. Splitting as 9 and 6 drops a zero, so the tens part becomes ten times too small.',
  'What is 72 divided by 6 by splitting?':
    'Split 72 as 60 + 12: 60 / 6 = 10 and 12 / 6 = 2, so 10 + 2 = **12**. Writing 72 / 6 = 6 copies the divisor, and splitting as 70 + 2 leaves a part that 6 cannot divide exactly.',
  'What is 96 divided by 8 by splitting?':
    '80 / 8 = 10 and 16 / 8 = 2, so the split sum is 10 + 2 = **12**. Splitting as 40 + 40 only reaches 5 + 5 = 10, two short of the true quotient.',
  'What is the remainder when 29 is divided by 4?':
    'Four sevens are 28, and 29 - 28 = 1, so the **remainder** is 1. Stopping at 4 x 6 = 24 leaves 5, which is larger than the divisor and so still holds another full group.',
  'The remainder is always less than':
    'After the largest possible number of full groups is taken out, the **remainder** must be smaller than the divisor, or one more group would fit. Saying it is less than zero is impossible, because a remainder is never negative.',
  'Which capital letter has a vertical line of symmetry?':
    'Letter A folds along a vertical line through its pointed top, so the left leg lands exactly on the right leg and **A** has a vertical line of symmetry. P is chosen by mistake because its loop suggests a fold, but the bowl sits on one side only and the two halves never match.',
  'A half turn is the same as a rotation of how many degrees?':
    'A full turn is 360 degrees, so a half turn is 360 divided by 2 = **180 degrees**. Picking 90 degrees confuses a half turn with a quarter turn, which covers only one quarter of the circle.',
  'The capital letter H has a vertical line of symmetry. Does it also have a horizontal line of symmetry?':
    'H matches itself when folded left over right and again when folded top over bottom, so the answer is **Yes**. A learner who tested only the upright fold answers no, missing that the two crossbars are identical and meet the middle.',
  'A square is rotated about its centre until it first looks exactly the same as before. Through what angle has it turned?':
    'A square has four identical sides, so a full turn of 360 degrees divides into 360 divided by 4 = **90 degrees** before it first looks the same. Answering 180 degrees counts two sides at a time and skips the first matching position.',
  'Which capital letter has a vertical line of symmetry but no horizontal line of symmetry?':
    'A folds in half down its middle, but folding it top over bottom fails because the legs stay low and the point stays high, so **A** has no horizontal line. Testing O by eye is the slip, since O actually folds both ways and is not the odd one out.',
  'Which digit looks the same after a half turn?':
    'Turning 8 through 180 degrees lands both loops exactly where they were, so **8** reads the same after a half turn. 5 is picked at a glance, but a half turn moves its flat top bar to the bottom, which is not how 5 is drawn.',
  'How many times does the digit 8 look the same during one full turn, counting its position at the start and at the end?':
    'The digit **8** matches itself at the start and again after the 180 degree half turn, so it looks the same 2 times in a full turn. Counting 4 assumes quarter turn symmetry, yet a 90 degree turn leaves both loops lying sideways.',
  'A vertical line of symmetry divides a shape into':
    'A vertical fold runs from the top edge to the bottom edge, so the two parts stand side by side as **left and right halves**. Top and bottom halves belong to a horizontal fold, where the dividing line runs across the shape instead.',
  'Which letter has a vertical line of symmetry?':
    'A fold down the middle of **A** lays the left stroke onto the right stroke, so the letter has a vertical line of symmetry. G is chosen because its curve looks balanced, but a small bar juts out on one side and no straight fold matches the halves.',
  'A horizontal line of symmetry divides a shape into':
    'A horizontal fold runs across the middle, leaving one part above the other, so the two pieces are **top and bottom halves**. Left and right halves describe the vertical fold, which splits the shape from side to side instead.',
  'Which letter has a horizontal line of symmetry?':
    'Folding **E** along a line through its middle bar stacks the top arm onto the bottom arm, so the two halves match. L is ruled out by mistake as though it mirrored E, but L has a long base and no middle arm, so no horizontal fold works.',
  'Which letter has no line of symmetry?':
    '**F** carries a top arm and a middle arm on the right only, so no fold, upright or across, makes its halves coincide. M is rejected on the feeling that slanted strokes cannot fold, yet a vertical fold through its centre matches the two peaks.',
  'Which letter has both vertical and horizontal symmetry?':
    '**H** folds left onto right along a vertical line and top onto bottom along a horizontal line, because its two uprights and its crossbar are identical. B is chosen for its straight spine, but the upper loop is smaller than the lower one, so the halves differ.',
  'Which digit has a vertical line of symmetry?':
    'Folding **8** down its middle lays the left loop onto the right loop, so the digit matches itself across a vertical line. 6 is picked because it looks nearly round, but its loop sits at the bottom with a tail curling up, so the sides differ.',
  'A shape has quarter turn symmetry if it looks the same after a turn of':
    'A quarter of a full 360 degree turn is 360 divided by 4 = **90 degrees**, the turn after which the shape first repeats. 180 degrees is chosen by mixing up quarter and half, since a half turn is two quarters.',
  'Which shape has quarter turn symmetry?':
    '**A square** repeats after every 90 degree turn because its four sides and four right angles are identical. A rectangle repeats only at 180 degrees, so it has half turn symmetry but never quarter turn symmetry.',
  'A half turn is':
    'Half of a full 360 degree turn is 360 divided by 2 = **180 degrees**. 90 degrees is the quarter turn, so picking it splits the half turn one step too far.',
  'Which shape looks the same after a half turn?':
    '**A rectangle** returns to its own outline after a 180 degree turn, because the two long sides swap and the two short sides swap. A kite is picked for looking even, but its long axis and short axis trade places, so a half turn does not match it.',
  'A rectangle is 9 cm long and 4 cm wide. What is its perimeter?':
    'The four sides add to 9 + 4 + 9 + 4, that is 2 x (9 + 4) = 2 x 13 = **26 cm**. 36 cm comes from multiplying 9 by 4, which measures the area inside rather than the distance round the edge.',
  'A rectangle is 12 cm long and 5 cm wide. What is its area?':
    'Area is length times breadth, so 12 x 5 = **60 square cm**. The 34 square cm answer comes from adding 12 + 5 = 17 and doubling it, which gives the perimeter and not the space covered.',
  'A square has a side of 15 cm. Find its perimeter.':
    'A square has four equal sides, so its perimeter is 4 x 15 = **60 cm**. Squaring 15 to get 225 would give the area, which counts the space inside instead of the boundary length.',
  'Two rectangles each have an area of 36 cm²: one is 9 cm × 4 cm and the other is 12 cm × 3 cm. Which has the greater perimeter?':
    'The 9 cm x 4 cm rectangle has perimeter 2 x 13 = 26 cm, while the 12 cm x 3 cm one has 2 x 15 = **30 cm**, so the longer, thinner rectangle wins. Assuming equal areas must give equal perimeters is the slip, since stretching a shape lengthens its boundary.',
  'A page is completely covered by square stickers of side 1 cm. There are 9 rows with 7 stickers in each row. What is the area of the page?':
    'Nine rows of seven stickers give 9 x 7 = **63** unit squares, so the page area is 63 square cm. Writing 63 cm drops the word square and turns an area into a length that a covered page does not have.',
  'The perimeter of a rectangle 8 cm by 5 cm is':
    'The four sides add to 8 + 5 + 8 + 5, that is 2 x (8 + 5) = 2 x 13 = **26 cm**. 40 cm comes from 8 x 5, which is the area of the rectangle and not the walk around its edge.',
  'The perimeter of a rectangle equals':
    'Walking right round the rectangle adds length, breadth, length, breadth, which collapses to **2 x (length + breadth)**. Length x breadth is the area rule, so choosing it counts unit squares instead of edge length.',
  'The perimeter of a square of side 6 cm is':
    'Four equal sides of 6 cm give 4 x 6 = **24 cm**. 36 cm comes from 6 x 6, which is the area in square centimetres and not the distance round the square.',
  'A shape covers 7 full squares of a grid. Its area is':
    'Each grid square counts as one unit of area, so seven covered squares give **7 square units**. Answering 7 units drops the word square and reports a length instead of the space covered.',
  'The area of a rectangle 9 cm by 4 cm is':
    'Area is length times breadth, so 9 x 4 = **36 square cm**. 26 square cm comes from 2 x (9 + 4), the perimeter value, and that number belongs in plain centimetres, not square centimetres.',
  'The area of a rectangle equals':
    'Area counts the unit squares inside, that is length rows of breadth squares, so the rule is **length x breadth**. 2 x (length + breadth) walks round the boundary and returns the perimeter instead.',
  'Two rectangles can have the same area but different':
    'Two rectangles can hold the same number of unit squares yet need different lengths of boundary, so they differ in **perimeters**. Angles is wrong because every rectangle has four 90 degree corners whatever its size.',
  'Which has the smaller perimeter for the same area?':
    'For a fixed area the **square** packs it most tightly, so area 36 as a 6 x 6 square has perimeter 24, while a 2 x 18 strip of the same area needs 40. A long thin rectangle is chosen for looking bigger, but stretching the same area adds boundary.',
  'A square has side 9 cm. Its perimeter is':
    'Four equal sides of 9 cm give 4 x 9 = **36 cm**. 81 cm comes from 9 x 9, which is the area in square centimetres and not the distance around the square.',
  'A square of side 3 units covers how many unit squares?':
    'A 3 by 3 square holds 3 rows of 3 unit squares, that is 3 x 3 = **9**. 6 is picked by adding 3 + 3, which counts two sides of the square instead of the squares inside it.',
  'How many minutes are there in 3 hours?':
    'One hour is 60 minutes, so three hours make 3 x 60 = **180** minutes. 300 comes from treating an hour as 100 minutes, a decimal habit that the clock does not follow.',
  'How is 4:45 p.m. written in the 24-hour format?':
    'For a p.m. time after noon add 12 to the hour: 4 + 12 = 16, so 4:45 p.m. is **16:45 hours**. 14:45 comes from adding 10 instead of 12, which lands two hours too early.',
  'A film starts at 6:40 p.m. and ends at 8:15 p.m. How long is the film?':
    'From 6:40 to 7:40 is one hour, then 7:40 to 8:15 adds 35 minutes, so the film runs **1 hour 35 minutes**. Reading 8:15 minus 6:40 straight across gives 2 hours 25 minutes, which forgets to borrow 60 minutes.',
  'A train journey takes 2 hours 45 minutes and the train reaches at 11:20 a.m. At what time did it start?':
    'Take back 2 hours from 11:20 to reach 9:20, then borrow an hour to take back 45 minutes: 9:20 - 45 = **8:35 a.m.** Going back 2 hours 35 minutes instead of 45 lands on 8:45, ten minutes late.',
  'In a race, Akira took 1 minute 55 seconds, Sunita took 1 minute 56 seconds and Mary took 1 minute 57 seconds. Who won the race?':
    'The smallest time wins, and 1 minute 55 seconds is less than 1 minute 56 and 1 minute 57, so **Akira** finished first. Picking Mary reverses the rule by treating the largest number of seconds as the best result.',
  'How many seconds are there in 2 minutes?':
    'One minute is 60 seconds, so two minutes make 2 x 60 = **120 seconds**. 200 seconds comes from counting a minute as 100 seconds, which is the decimal slip again.',
  'How many minutes and seconds are there in 320 seconds?':
    'Divide 320 by 60 to get 5 whole minutes with 20 seconds left over, so 320 seconds is **5 minutes 20 seconds**. 6 minutes 20 seconds rounds the 5 up and would need 380 seconds.',
  '3 p.m. on a 24-hour clock is':
    'For an afternoon time add 12 to the hour: 3 + 12 = 15, so 3 p.m. is **15:00**. 13:00 comes from adding 10, which would make it 1 p.m. instead.',
  '18:30 on a 12-hour clock is':
    'Subtract 12 from the hour and keep p.m.: 18 - 12 = 6, so 18:30 is **6:30 p.m.** 8:30 p.m. comes from subtracting 10, a decimal habit rather than the 12-hour clock.',
  'How many seconds are there in one minute?':
    'The second hand needs **60** ticks to travel once round the dial, so one minute holds 60 seconds. 100 comes from switching to a hundred based count that clocks never use.',
  'The second hand moves one small division in':
    'The dial is cut into 60 small divisions and the second hand crosses one of them each second, so one division is **one second**. Five seconds is the gap between two big number marks, which spans five small divisions.',
  'How many minutes are there in one hour?':
    'The minute hand comes back to the same mark after **60** minutes, so one hour holds 60 minutes. 24 is the number of hours in a day, which is a different unit altogether.',
  '2 hours 15 minutes equals':
    'Two hours is 2 x 60 = 120 minutes, and adding 15 gives **135 minutes**. 215 comes from writing the hours and the minutes side by side as digits without converting.',
  '3 minutes equals':
    'Three minutes of 60 seconds each make 3 x 60 = **180 seconds**. 300 seconds comes from treating a minute as 100 seconds, which stretches every minute by 40.',
  'A film starts at 6:15 p.m. and ends at 8:00 p.m. How long is it?':
    'From 6:15 to 7:15 is one hour and from 7:15 to 8:00 is 45 minutes, so the film lasts **1 hour 45 minutes**. 2 hours is chosen by reading only the 6 and the 8 and ignoring the quarter hour at the start.',
  'Elapsed time means':
    'Elapsed time is the gap measured from the start to the finish, so it is **the time between the start and the finish**. Adding the two clock times is the mistake, because a start time plus a finish time is not a duration.',
  'A class ends at 11:30 and lasted 45 minutes. It started at':
    'Borrow an hour to subtract 45 minutes from 11:30: 10:90 - 45 = **10:45**. 12:15 comes from adding 45 instead of subtracting, which puts the start after the end.',
  'A train leaves at 9:20 and takes 1 hour 40 minutes. It arrives at':
    '9:20 plus 1 hour is 10:20, and 20 minutes plus 40 minutes makes a full 60 minutes, so the train arrives at **11:00**. 11:40 comes from adding hours and minutes separately as 9 + 1 and 20 + 40 without carrying.',
  'How many factors does 12 have?':
    'Listing the factor pairs of 12 gives 1 x 12, 2 x 6 and 3 x 4, so the factors are 1, 2, 3, 4, 6 and 12, which is **6** factors. Answering 4 counts only the pairs and forgets that each pair supplies two different factors.',
  'What is the greatest common factor of 18 and 24?':
    'Breaking down gives 18 = 2 x 3 x 3 and 24 = 2 x 2 x 2 x 3, so the shared part is 2 x 3 = **6**. Picking 12 fails because 12 does not divide 18 evenly, since 18 / 12 leaves a remainder of 6.',
  'Find the lowest common multiple of 6 and 8.':
    'The multiples of 6 are 6, 12, 18, 24 and the multiples of 8 are 8, 16, 24, so the first one they share is **24**. Multiplying 6 x 8 = 48 also gives a common multiple, but it is not the lowest one.',
  'A frog jumps 4 steps at a time from 0 and a rabbit jumps 6 steps at a time from 0. What is the first number after 0 on which both land?':
    'The frog lands on 4, 8, 12, 16 and the rabbit on 6, 12, 18, so the first shared landing is **12**. Picking 24 finds a later common landing and ignores that 12 is reached first.',
  'Robby the rabbit takes jumps of 4 starting from 0. Which of these numbers will Robby land on?':
    'Jumping 4 at a time from 0 gives 4, 8, 12, 16, 20, 24, so **24** is one of the landings. 34 is not reachable because 34 / 4 = 8 remainder 2, so the jump overshoots it.',
  'Which of these numbers is a prime number?':
    '13 has only the two factors 1 and 13 and cannot be split into smaller equal groups, so it is **prime**. 15 is not prime because 15 = 3 x 5, which gives it the extra factors 3 and 5.',
  'Which pair contains two prime numbers?':
    '7 and 11 each have only 1 and themselves as factors, so both are **prime**. The pair 9 and 11 fails because 9 = 3 x 3, giving it three factors.',
  'Which number is a common multiple of 4 and 6?':
    'Multiples of 4 are 4, 8, 12 and multiples of 6 are 6, 12, so **12** appears in both lists. 16 is a multiple of 4 only, because 16 / 6 is not a whole number.',
  'The smallest common multiple of 3 and 5 is':
    '3 and 5 share no factor other than 1, so their smallest common multiple is 3 x 5 = **15**. Choosing 30 doubles it and is a common multiple, but not the smallest one.',
  'Which number is a factor of 20?':
    '20 = 5 x 4 exactly, so **5** divides 20 with no remainder and leaves nothing over. 6 is not a factor because 20 / 6 = 3 remainder 2, so the division is not exact.',
  'Which is a multiple of 6?':
    'Counting by sixes gives 6, 12, 18, so **18** is a multiple of 6. 16 does not work because 16 / 6 = 2 remainder 4, so it falls between two multiples.',
  'The multiples of a number are found by':
    'Multiples come from skip counting by the number, that is **multiplying it by 1, 2, 3, and so on**, as in 4, 8, 12. Adding 1 each time just counts upward by ones and never builds the multiples of a number.',
  'Which is a common factor of 12 and 18?':
    'The factors of 12 are 1, 2, 3, 4, 6, 12 and of 18 are 1, 2, 3, 6, 9, 18, so **6** divides both. 8 works for neither, since 12 / 8 and 18 / 8 both leave a remainder.',
  'A common factor divides':
    'A factor leaves no remainder, so a **common factor divides both numbers exactly**. Naming only the larger number describes an ordinary factor and ignores that the divisor must work for both.',
  'Starting at 0 and jumping 4 at a time, the third landing is at':
    'The jumps give 4 after one, 8 after two and 12 after three, so the third landing is at **12**. Answering 8 stops at the second landing, one jump short.',
  'Jumps of 5 on a number line land on the multiples of':
    'Jumping 5 at a time from 0 gives 0, 5, 10, 15, so every landing is a multiple of **5**. 10 is itself one of those landings, not the number whose multiples they are.',
  'Which number is NOT a factor of 24?':
    'The factors of 24 are 1, 2, 3, 4, 6, 8, 12 and 24, so **5** is absent and 24 / 5 = 4 remainder 4. 12 is a true factor because 12 x 2 = 24 exactly.',
  'Which of these is NOT a prime number?':
    '9 = 3 x 3, so it has three factors, 1, 3 and 9, and is therefore **not prime**. 7 is prime because nothing other than 1 and 7 divides it evenly.',
  'Which direction is opposite to East?':
    'East and **West** sit at the two ends of the same compass line, so West is the exact opposite of East. North stands at right angles to East, which makes it a turn of 90 degrees rather than a reversal.',
  'The Sun rises in the East. If you stand facing the rising Sun, which direction is on your left?':
    'Facing the sunrise means facing **North**, because West is then behind you and your left hand points north. Choosing South describes the hand on your right, which is the reverse side.',
  'On a map, one star symbol stands for 5 temples. What do 4 such symbols stand for?':
    'Each star carries the value 5, so 4 stars give 4 x 5 = **20 temples**. A slip of adding 4 and 5 to get 9 ignores that every symbol is worth a whole 5.',
  'On a map, the market is 3 km north of the school and the park is 4 km east of the school. What is the length of the route from the market to the park through the school?':
    'Travelling through the school means going 3 km down to the school and then 4 km across, so 3 + 4 = **7 km**. The 5 km figure is the straight shortcut from market to park, which skips the school entirely.',
  'A classroom has 5 rows of desks with 6 desks in each row. How many desks are there in all?':
    'Five rows holding six desks each give 5 x 6 = **30** desks. 11 comes from adding 5 + 6, which treats a row count and a desk count as if they could simply be summed.',
  'On the zoo grid, a point is 6 steps east and 2 steps north of 0. How is its position written?':
    'A grid position lists the east steps first and the north steps second, so 6 east and 2 north is **(6, 2)**. Reversing the pair to (2, 6) swaps the two directions and marks a different square.',
  'Which are the four cardinal directions?':
    'The four cardinal directions are **north, south, east and west**, the fixed points of a compass. Up, down, left and right change as you turn, so they cannot name a fixed direction on a map.',
  'On most maps, north is shown':
    'By convention **north** is drawn at the top of a map, with south at the bottom. Putting north at the bottom flips the map upside down and would place south on top.',
  'In the morning, the Sun rises in the':
    'The Sun comes over the horizon in the **east**, which is why that side is bright at dawn. West is the side where it sets in the evening, the opposite edge of the sky.',
  'At noon the Sun is roughly towards the':
    'India lies north of the equator, so at midday the Sun stands roughly towards the **south**. Calling it east describes the sunrise position, several hours earlier in the day.',
  'A map key explains':
    'The **key** lists each symbol beside its meaning, so a reader can decode every mark on the map. The map maker\'s name is only a credit and explains no symbols at all.',
  'A blue patch on a map usually shows':
    'Map makers colour water blue, so a blue patch usually stands for a **river, lake or sea**. Green is the colour used for forests, so a blue area cannot be woodland.',
  'A route on a map shows':
    'A **route** traces the path from one place to another, often with distances marked along it. Population is a count of people, so it cannot be drawn as a line on a map.',
  'To go from the school to the market you follow':
    'The **marked route** is the drawn path joining the two places, so you follow it from start to finish. A random line cuts across buildings and fields and leads nowhere useful.',
  'In a grid, a row runs':
    'A **row** runs across the grid from left to right, the same way we read a line of text. Top to bottom describes a column, which is the crossing direction.',
  'In a grid, a column runs':
    'A **column** runs down the grid from top to bottom, stacking squares one above another. Left to right is a row, so that choice swaps the two directions.',
  'A grid reference gives a position using':
    'A **row and a column** cross at exactly one square, so together they fix a single position. A symbol alone can repeat in many squares, so it cannot single one out.',
  'Grid references help us to':
    'Because each row meets each column once, a grid reference locates a place **exactly on a map**. Weight and money are read from scales and notes, not from a map position.',
  'In a class, 7 children like cricket, 5 like football and 4 like hockey. How many children were asked in all?':
    'Adding the three groups gives 7 + 5 + 4 = **16** children. 12 comes from adding only the 7 and the 5, leaving the 4 hockey fans out of the count.',
  'A pictograph uses one symbol for 5 books. How many books do 6 symbols show?':
    'Each symbol is worth 5 books, so 6 symbols show 6 x 5 = **30 books**. 11 comes from adding 6 and 5, which treats the key value as another symbol.',
  'A bar graph must show 40 children using bars no taller than 8 units. What scale should be used?':
    'Sharing 40 children over 8 units gives 40 / 8 = 5, so the scale is **5 children per unit**. A scale of 1 child per unit would need a bar 40 units tall and run off the paper.',
  'In a pictograph, Monday shows 4 symbols and Tuesday shows 6 symbols, where each symbol stands for 25 visitors. How many more visitors came on Tuesday?':
    'Tuesday has 2 symbols more than Monday, and 2 x 25 = **50** extra visitors. Working out 6 x 25 = 150 gives Tuesday\'s whole total instead of the difference.',
  'Ravi recorded the number of cars passing his gate in four hours: 12, 15, 9 and 14. How many cars did he record in all?':
    'Adding step by step, 12 + 15 = 27, then 27 + 9 = 36 and 36 + 14 = **50** cars. 49 comes from a slip in the final step, since 36 + 14 is 50 and not 49.',
  'A bar graph uses a scale in which 1 unit on the vertical line stands for 2 children. How high should the bar be to show 10 children?':
    'Each unit carries 2 children, so 10 children need 10 / 2 = **5 units**. 20 units comes from multiplying 10 by 2, which doubles the height instead of halving it.',
  'The best way to find the favourite sport of your class is to':
    'A favourite sport is a personal choice, so you must **ask each student and record the answers**. Guessing produces a belief rather than data, and no one can check it.',
  'A frequency table shows':
    'A **frequency table** pairs each value with the number of times it occurs, as 4 appears 3 times. Keeping only the largest value throws away every other count.',
  'In the data 4, 4, 5, 6, 4, the frequency of 4 is':
    'Counting the entries, 4 appears at the first, second and fifth places, so its frequency is **3**. Answering 4 repeats the value itself instead of counting how often it appears.',
  'Why do we choose a scale for a graph?':
    'A **scale** shrinks each value into a few units, so large numbers still fit in a small space. Hiding the data defeats the purpose, since a graph exists to show it plainly.',
  'If 1 unit = 5 children, 4 units show':
    'Four units at 5 children each give 4 x 5 = **20 children**. 9 comes from adding 5 and 4 rather than multiplying the unit value by the number of units.',
  'In a pictograph, each symbol stands for':
    'Every symbol is read with the value stated in the **key**, such as 1 symbol = 5 books. Assuming a symbol always means one item undercounts a pictograph by the whole key value.',
  'If one symbol = 10 books and there are 3 symbols, the total is':
    'Three symbols at 10 books each give 3 x 10 = **30 books** as the total for that row. 13 comes from adding 10 and 3, mixing the key value with a count of symbols.',
  'In a bar graph, bars should be':
    'Bars of **equal width with equal gaps** let the eye compare heights fairly. Joining the bars into a block makes the categories look like one solid shape.',
  'The height of a bar shows':
    'The **height of a bar** is drawn to match its value, so the taller bar means the larger count. The colour only separates categories and carries no number at all.',
  'Which is easiest for comparing many categories?':
    'A **bar graph** sets the categories side by side, so the tallest bar is spotted at a glance. A paragraph buries the numbers in words and makes comparison slow work.',
  'If class A has 20 and class B has 32, class B has':
    'Subtracting gives 32 - 20 = **12**, so class B has 12 more than class A. 52 comes from adding the two totals instead of taking the difference.',
  'Why should data be recorded as soon as it is collected?':
    'Writing counts down at once means **no information is forgotten or changed** before it is used. Neatness is only about how the page looks and says nothing about accuracy.',
  'What is the 5th triangular number?':
    'Triangular numbers pile up counting numbers: 1, 3, 6, 10 and then 10 + 5 = **15**. Picking 10 stops one row early, since that is only the 4th triangular number.',
  'Which of these is a square number?':
    'A square number is a counting number multiplied by itself, and 4 x 4 = **16**, so 16 belongs on the list. Choosing 12 or 20 assumes any even number is a square, but nothing times itself gives them.',
  'Without adding the numbers one by one, find 1 + 3 + 5 + 7 + 9.':
    'The first five odd numbers always total 5 x 5 = **25**, so no long addition is needed. Reaching 35 comes from adding the odd numbers as if the total grew step by step without the square pattern.',
  'What is the difference between the 4th cube number and the 4th square number?':
    'The 4th cube is 4 x 4 x 4 = 64 and the 4th square is 4 x 4 = 16, so 64 - 16 = **48**. Getting 52 or 60 means one power was mis-multiplied, as when the cube is taken as 68.',
  'Which is the smallest counting number?':
    'Counting numbers begin at **1**, so 1 is the smallest, with 2, 3, 4 and so on following it. Treating 0 as the smallest mixes counting numbers up with whole numbers, which do include zero.',
  'Counting numbers are also called':
    'The numbers used to count objects are the **natural numbers**, that is 1, 2, 3 and onward. Calling them whole numbers is the near miss, because that set also contains 0.',
  'Which of these is NOT a counting number?':
    'Counting begins at 1, so 0 is the only value here that is **not** a counting number. Marking 1 as the odd one out forgets that the counting list starts there, not at zero.',
  'The Virahanka numbers are also known as':
    'The Virahanka numbers run 1, 1, 2, 3, 5, 8 under the same rule as the **Fibonacci numbers**, named after a later European writer. Calling them prime numbers ignores that each term is a sum of the two before it.',
  'Which number comes next in the Virahanka sequence 1, 1, 2, 3, 5, ...?':
    'Each term is the sum of the two before it, so 3 + 5 = **8** comes next. Answering 7 or 10 assumes the sequence adds a fixed amount each time, which it never does.',
  'How is each Virahanka number made from the ones before it?':
    'A Virahanka number is the **sum of the two numbers before it**, as 2 = 1 + 1 and 3 = 1 + 2 show. Doubling the last number breaks at the start, since twice 2 gives 4 and the sequence has 3.',
  'Triangular numbers are made by adding':
    'Triangular numbers come from adding **consecutive counting numbers**: 1, then 1 + 2 = 3, then 1 + 2 + 3 = 6. Using consecutive odd numbers instead produces the square numbers 1, 4, 9 and 16.',
  'What is the 6th square number?':
    'The 6th square number is 6 x 6 = **36**, since a square multiplies a counting number by itself. Choosing 30 or 42 multiplies 6 by 5 or by 7, which builds a rectangle rather than a square.',
  'Square numbers are obtained by':
    'A square number is made by **multiplying a number by itself**, so 5 x 5 = 25. Adding the number twice gives only 10 for 5, which is double the number and not a square.',
  'What is the cube of 3?':
    'The cube of 3 is 3 x 3 x 3 = **27**. Answering 9 stops at the square, since 3 x 3 uses only two factors, and 6 comes from adding 3 + 3 instead of multiplying.',
  'A cube number is a number multiplied by itself':
    'A cube number multiplies a number by itself **three times**, as 2 x 2 x 2 = 8 shows. Stopping at two times gives a square, which is why 4 is a square but never a cube.',
  '1 + 3 + 5 + 7 equals':
    'The first four odd numbers add to 4 x 4 = **16**, since 1 + 3 + 5 + 7 = 16. Answering 15 comes from adding 1 to 5 instead, which gives a triangular number rather than this odd sum.',
  'The sum of the first n odd numbers is':
    'The first n odd numbers always total **n squared**, as 1 + 3 = 4 and 1 + 3 + 5 = 9 show. Reading it as 2n gives 6 when n = 3, which is far short of the true 9.',
  'Which of these is a triangular number?':
    'Triangular numbers are 1, 3, 6, 10, 15, so **10** belongs on the list as 1 + 2 + 3 + 4. Picking 9 or 12 mistakes a near neighbour for a value the stacking rule actually produces.',
  'A ray has':
    'A ray starts at **one end point** and runs on for ever in one direction, like a torch beam. Giving it two end points describes a line segment, which is cut off at both ends.',
  'An angle of 250° is called':
    'Any angle bigger than 180 degrees but smaller than 360 is a **reflex angle**, and 250 sits inside that range. Calling it obtuse ignores the limit, since obtuse angles stop below 180 degrees.',
  'A right angle measures 90°. How many degrees are there in a straight angle?':
    'A straight angle is two right angles laid together, so 90 + 90 = **180 degrees**. Answering 90 degrees repeats a single right angle and forgets the second arm, which continues along the same line.',
  'Two angles lie together on one side of a straight line. One of them measures 68°. What is the measure of the other?':
    'Angles on one side of a straight line add to 180 degrees, so 180 - 68 = **112 degrees**. Getting 132 or 122 means subtracting from 200 or 190 instead of from a straight angle.',
  'A point shows':
    'A point marks **an exact position** and nothing else, which is why it is drawn as a dot. Giving it length or width turns it into a line or a shape that takes up space.',
  'How is a point usually marked in geometry?':
    'Geometry marks a point with a **small dot and a capital letter**, such as A or P, so it can be named. Using an arrow head would instead show a ray running on for ever.',
  'A point has':
    'A point has **no length, no breadth and no thickness**, so it occupies no space at all. Allowing it length but no breadth describes a line, not a point.',
  'How many end points does a line segment have?':
    'A line segment is cut off at both ends, so it has **two** end points, for example A and B. Saying it has one end point describes a ray, which runs on for ever at the other end.',
  'Which of these is an example of a line segment?':
    'The straight edge of a ruler has two fixed ends, so it models a **line segment**. A ray of light is the standard example of a ray, since it leaves the torch and never stops.',
  'What is the difference between a line and a line segment?':
    'A line has **no end points** and runs on for ever both ways, while a line segment is fixed between two points. Saying a line is always shorter reverses the truth, since the segment is the bounded piece.',
  'A ray of light is a good example of':
    'Light leaves a torch from one point and travels onward, which is exactly a **ray**. Calling it a line segment would mean the light stops at a second end point, and it does not.',
  'The common point of the two arms of an angle is the':
    'The two arms of an angle meet at a single point called the **vertex**, usually labelled with a capital letter. Naming a ray or a segment describes one arm only, not the point where they meet.',
  'An angle is formed by two rays':
    'An angle needs two rays that **meet at a common point**, and the opening between them is the angle. Rays that never meet stay parallel, so they enclose no angle at all.',
  'Angles are measured in':
    'Angles are measured in **degrees**, so a right angle is 90 degrees and a straight angle is 180. Centimetres measure length and grams measure mass, so neither can describe a turn.',
  'Which instrument measures an angle?':
    'A **protractor** is the half disc marked 0 to 180 that sits on the vertex to read an angle. A ruler measures straight length and a compass draws circles, so neither reads degrees.',
  'A reflex angle is greater than':
    'A reflex angle is larger than a straight angle, so it is **greater than 180 degrees** yet still under 360. Saying greater than 90 degrees wrongly includes obtuse angles such as 120 degrees.',
  'Which of these is a reflex angle?':
    'A reflex angle lies between 180 and 360 degrees, so **270 degrees** is the reflex one here. Marking 180 degrees fails because that is a straight angle, exactly half a turn.',
  'A ray is named with':
    'A ray is named with **its end point first**, as in ray AB, because that is where the ray begins. Using three letters always is the angle rule, since an angle has a vertex between two arm points.',
  'What is the sum of the digits of 4,729?':
    'Add every digit: 4 + 7 + 2 + 9 = **22**. Arriving at 20 means one digit was skipped, as happens when the 2 in the hundreds place is overlooked.',
  'Which of these numbers is a palindrome?':
    'A palindrome reads the same both ways, and 4,554 reversed is still **4,554**. Choosing 3,452 fails because reversing it gives 2,543, which is a different number.',
  'What is the Kaprekar constant for three-digit numbers?':
    'Three-digit Kaprekar steps always end at **495**, as in 532 - 235 = 297, then 972 - 279 = 693, and the chain settles at 495. Stopping at 6174 mixes up the four-digit constant with the three-digit one.',
  'In the Collatz rule an odd number is tripled and 1 is added. Starting from 7, what is the next number?':
    'An odd number is tripled and 1 added, so 3 x 7 + 1 = **22** is the next number after 7. Answering 21 only triples 7 and forgets the plus 1 that the rule requires.',
  'In the Number Play game, a supercell holds a number that is':
    'A supercell holds the **sum of its neighbours**, so the numbers around it decide its value. Treating it as the largest number in the grid ignores the adding rule completely.',
  'What is the aim of the supercell game?':
    'The aim is to **fill every cell so that each number equals the sum of its neighbours**, making the whole grid consistent. Leaving cells empty dodges the work and never satisfies the rule.',
  'If two neighbours of a cell hold 3 and 4, what number should the supercell hold?':
    'A supercell is the sum of its neighbours, so 3 + 4 = **7**. Multiplying to get 12 treats the neighbours as factors, which the rule never asks for.',
  'What does a winning strategy in a number game mean?':
    'A winning strategy is **a plan that always wins if you play it correctly**, whatever the opponent does. Copying the opponent\'s moves only works by luck, since it leaves them in control.',
  'Why is it useful to look for a pattern while playing a number game?':
    'Patterns show how the numbers behave, so they **help you find a winning strategy**. Saying a pattern is of no use misses that every shortcut in the game comes from one.',
  'In a two-player number game, working backwards from the target number helps you':
    'Working backwards from the target shows the replies that force a win, so you can **plan your moves ahead**. Forgetting the total leaves you guessing each turn instead of steering towards it.',
  'Which number is a palindrome?':
    '1,221 reversed is still **1,221**, so it reads the same both ways. Picking 1,212 fails because reversing it gives 2,121, which is a different number.',
  'A palindrome reads the same':
    'A palindrome reads **forwards and backwards** as the same number or word, like 1221 or madam. Reading it only forwards describes any number, so it names nothing special.',
  'What is the digit sum of 4,729?':
    'Digit sum means adding each digit: 4 + 7 + 2 + 9 = **22**. Getting 18 or 13 means a digit was dropped or two digits were joined before adding.',
  'The digit sum is found by':
    'The digit sum comes from **adding all the digits of a number**, so 456 gives 4 + 5 + 6 = 15. Counting the digits gives 3 for 456, which is how many there are, not their total.',
  'The Kaprekar constant for three-digit numbers is':
    'Three-digit Kaprekar steps settle on **495**, for example 532 - 235 = 297 and then 972 - 279 = 693 lead there. Choosing 6174 is the four-digit constant, which a three-digit number cannot reach.',
  'The Kaprekar constant for four-digit numbers is':
    'Four-digit Kaprekar steps settle on **6174**, as 7,641 - 1,467 = 6,174 shows in a single step. Choosing 495 is the three-digit constant, so a four-digit number never lands there.',
  'In the Collatz rule, an even number is':
    'In the Collatz rule an even number is **halved**, so 8 becomes 4 and 10 becomes 5. Tripling and adding 1 is the odd branch, which would send 8 up to 25 instead of down.',
  'In the Collatz rule, an odd number (other than 1) is':
    'An odd number is **tripled and increased by 1**, so 7 becomes 3 x 7 + 1 = 22. Halving instead would give a fraction such as 3.5, which is outside the counting numbers.',
  'How many tally marks are bundled together to make one group?':
    'Tally marks are bundled in fives: four upright strokes with one diagonal stroke drawn across them make **5**. A bundle of ten would need ten separate strokes before it closed, and a bundle of four would leave the fifth mark stranded.',
  'In a survey of 20 children, 8 chose mango and 5 chose apple. How many chose neither?':
    'Mango and apple account for 8 + 5 = 13 children, so the rest chose neither: 20 - 13 = **7**. Answering 15 adds 8 and 5 but never subtracts them from 20, so it counts the children who did choose a fruit.',
  'In a pictograph one symbol stands for 4 cars. How many cars does a row of 7 symbols show?':
    'Each symbol stands for 4 cars, so 7 symbols show 7 x 4 = **28 cars**. Reading a row of 7 symbols as 7 cars forgets to multiply by the key value of 4.',
  'A bar graph shows three bars of 4, 6 and 8 units, where 1 unit stands for 15 students. How many students do the three bars show in all?':
    'The bars total 4 + 6 + 8 = 18 units, and each unit is 15 students, so 18 x 15 = **270 students**. Answering 300 assumes 20 units of 15, which adds a fourth bar that the graph does not have.',
  'What is data?':
    'Data means **information collected about something**, such as the heights or favourite fruits of a class, before it is sorted or drawn. A graph is only one way of presenting data, so calling data a kind of graph confuses the numbers with the picture.',
  'What is the best way to find the favourite fruit of your class?':
    'A survey in which you **ask each student and record the answers** gives every child\'s real choice exactly once. Guessing the answer replaces evidence with opinion, so the result cannot be checked or counted.',
  'What is a tally mark used for?':
    'A tally mark is a quick stroke for **counting how often something occurs**, one mark per item as you go. Drawing a graph is a later step that uses those counts, so it is not what the mark itself does.',
  'What does a bar graph use to show data?':
    'A bar graph shows each group as a **bar of different heights**, and the taller the bar the larger the count. A circle divided into parts is a pie chart, which shows shares of a whole rather than counts.',
  'In a bar graph, what does the height of a bar show?':
    'The height of each bar, read against the vertical scale, shows **how many items are in that group**. The colour or the name only labels the group, so neither changes when the count changes.',
  'Why must all the bars in a bar graph be the same width?':
    'Equal widths keep the bars comparable, so a taller bar always means more and the graph stays **easy and fair to read**. Making a bar wider to look pretty would let it seem bigger without any change in the data.',
  'Tally marks are grouped in':
    'Tally marks are grouped in **fives** so that long counts stay readable: four upright strokes plus one diagonal stroke make a bundle of 5. Grouping in tens would need ten separate strokes before any bundle could be closed.',
  'Four vertical marks with one diagonal stroke stand for':
    'The four upright strokes count 1, 2, 3, 4 and the diagonal stroke closes the bundle, so the group stands for **5**. Reading the four strokes alone as 4 stops one short by ignoring the crossing stroke.',
  'Frequency tells us':
    'Frequency is **how often a value occurs** in a data set, so it is a count rather than a size. The largest value is the maximum and the spread is the range, so neither of those is a frequency.',
  'In the data 2, 3, 3, 4, 3, the frequency of 3 is':
    'Counting the 3s in 2, 3, 3, 4, 3 gives three of them, so the frequency is **3**. Answering 4 counts the largest value in the list instead of how many times 3 appears.',
  'A pictograph shows data using':
    'A pictograph replaces numbers with **pictures or symbols**, and a key states how much one picture is worth. Bars belong to a bar graph, so they do not appear in a pictograph at all.',
  'A key in a pictograph tells us':
    'The key fixes the value of a single picture, so it tells us **what one symbol stands for**, such as 1 symbol = 4 cars. The title names the chart but says nothing about how many each symbol counts.',
  'The scale of a graph tells us':
    'The scale states **what one unit on the axis represents**, for example 1 unit = 10 students, so every height can be turned into real numbers. The number of bars is just how many groups were recorded, not what a unit is worth.',
  'If 1 unit = 10 students, a bar of 3 units shows':
    'Three units at 10 students each give 3 x 10 = **30 students**. Reading the bar as 3 students treats the height as a count and ignores the scale completely.',
  'Which of these is a prime number?':
    '29 has no factors except 1 and itself, so it is **prime**. Each other choice is composite: 21 = 3 x 7, 27 = 3 x 9 and 33 = 3 x 11, which shows that being odd does not make a number prime.',
  'Which pair of numbers is co-prime?':
    '8 = 2 x 2 x 2 and 15 = 3 x 5 share no factor, so their HCF is 1 and they are **co-prime**. The pair 14 and 21 both divide by 7, so they share a factor greater than 1 and are not co-prime.',
  'Write 84 as a product of prime numbers.':
    '84 = 2 x 42 = 2 x 2 x 21 = 2 x 2 x 3 x 7, and 2 x 2 x 3 x 7 = 4 x 21 = **84** with every factor prime. Stopping at 4 x 21 leaves composite numbers in the product, which is not a prime factorisation.',
  'What is the smallest number that must be added to 43 to make it divisible by 5?':
    'The next multiple of 5 after 43 is 45, and 45 - 43 = **2**. Adding 5 overshoots to 48, which is not a multiple of 5 either, so the smallest number is not the divisor itself.',
  'Which number is a common multiple of 2 and 3?':
    '6 is even and also 3 x 2, so both 2 and 3 divide it exactly, making it a **common multiple**. 9 is a multiple of 3 alone, because 2 does not divide 9 evenly.',
  'What is the smallest common multiple of 4 and 6?':
    'Multiples of 4 are 4, 8, 12, 16 and of 6 are 6, 12, 18, so the first shared one is **12**. Choosing 24 picks a common multiple but not the smallest, since 12 comes earlier.',
  'A common multiple of two numbers is a number that':
    'A common multiple must be divisible by each number, so **both numbers divide it exactly**, as 12 is divided by 4 and by 6. A number that divides both of them is a common factor, which is the opposite relationship.',
  'Which number is a common factor of 12 and 18?':
    '12 = 6 x 2 and 18 = 6 x 3, so **6** divides both of them exactly and is their common factor. 9 divides 18 but leaves a remainder with 12, so it cannot be a common factor.',
  'What is the highest common factor of 8 and 12?':
    'Factors of 8 are 1, 2, 4, 8 and of 12 are 1, 2, 3, 4, 6, 12, so the greatest shared one is **4**. Picking 2 finds a common factor but not the highest, since 4 also divides both.',
  'A common factor of two numbers is a number that':
    'A common factor divides each number with no remainder, so it **divides both of them exactly**, as 6 does for 12 and 18. Being a multiple of both numbers would make it larger than each of them, which is the common multiple case.',
  '1 is neither prime nor composite because it has':
    'The only factor of 1 is 1 itself, so it has **only one factor** and cannot have the two distinct factors a prime needs. Having no factors is impossible, since 1 always divides 1.',
  'Two numbers are co-prime when their HCF is':
    'Co-prime numbers share no factor except 1, so their HCF is exactly **1**, as with 8 and 15. An HCF of 2 would mean both numbers are even, which is the opposite of being co-prime.',
  'The prime factorisation of 24 is':
    'Repeated division gives 24 = 2 x 2 x 2 x 3, and multiplying back gives 8 x 3 = **24** with every factor prime. Writing 4 x 6 gives the right total but both factors are composite, so it is not a prime factorisation.',
  'Prime factorisation uses only':
    'A prime factorisation breaks a number down until every factor is **prime**, such as 30 = 2 x 3 x 5. Using only even numbers would stop at 4 or 6, which still split further.',
  'A number is divisible by 10 if':
    '10 = 2 x 5, so a number is divisible by 10 only when **its last digit is 0**, like 40 or 270. Being even is not enough, since 24 is even yet does not divide by 10.',
  'How many factors does 16 have?':
    'The factors of 16 are 1, 2, 4, 8 and 16, which makes **5** factors. Answering 4 stops before 16 itself, forgetting that every number is a factor of itself.',
  'Which pair is NOT co-prime?':
    '12 and 18 are both divisible by 6, so their HCF is 6 and they are **not co-prime**. The pair 5 and 7 shares only the factor 1, so those two are co-prime and do not fit the question.',
  'A number is divisible by 3 if':
    'A number is divisible by 3 when **the sum of its digits is divisible by 3**, as 4 + 5 + 6 = 15 for 456. Merely ending in 3 says nothing, because 13 and 23 are not divisible by 3.',
  'What is the perimeter of a square of side 7 cm?':
    'A square has four equal sides, so the perimeter is 4 x 7 = **28 cm**. Answering 49 cm gives the area, 7 x 7, instead of the distance around the square.',
  'What is the area of a square of side 9 cm?':
    'Area of a square is side x side, so 9 x 9 = **81 cm2**. Answering 36 cm2 uses 4 x 9, which is the perimeter of the square, not the space inside it.',
  'A triangle has sides of 8 cm, 6 cm and 5 cm. Find its perimeter.':
    'The perimeter is the sum of the three sides: 8 + 6 + 5 = **19 cm**. Multiplying them instead (8 x 6 x 5) gives 240, which measures nothing about the boundary.',
  'A triangle has a base of 12 cm and a height of 7 cm. What is its area?':
    'Area of a triangle is half base times height, so (12 x 7) / 2 = 84 / 2 = **42 cm2**. Forgetting the half gives 84 cm2, the area of the rectangle drawn around the triangle.',
  'What is the perimeter of a rectangle?':
    'The perimeter is the **total length of its four sides**, the distance you walk around the shape. The space inside it is the area, which is measured in square units instead.',
  'A rectangle is 5 cm long and 3 cm wide. What is its perimeter?':
    'Perimeter = 2 x (5 + 3) = 2 x 8 = **16 cm**, because the two lengths and two breadths are each counted once. Answering 15 cm gives the area, 5 x 3, instead of the length of the boundary.',
  'Which formula gives the perimeter of a rectangle?':
    'A rectangle has two lengths and two breadths, so adding one of each and doubling gives **2 x (length + breadth)**. Using length + breadth alone counts only half of the boundary.',
  'What does the area of a rectangle measure?':
    'Area measures **the space it covers**, counted in square units laid inside the shape. The distance around it is the perimeter, which is a length rather than a surface.',
  'A rectangle is 5 cm long and 3 cm wide. What is its area?':
    'Area = length x breadth = 5 x 3 = **15 square cm**, the number of 1 cm squares that fit inside the rectangle. Answering 8 square cm adds the two sides (5 + 3) instead of multiplying them.',
  'Which formula gives the area of a rectangle?':
    'The area of a rectangle is **length x breadth**, multiplying the two sides that meet at a corner. Adding them instead gives half the perimeter, not the space inside.',
  'The perimeter of a square of side 7 cm is':
    'Four equal sides of 7 cm give 4 x 7 = **28 cm** around the square. Answering 14 cm doubles the side once instead of counting all four sides.',
  'The perimeter of a square is':
    'Because all four sides are equal, the perimeter is **4 x side**. Side x side gives the area, which is measured in square units rather than centimetres.',
  'The perimeter of a triangle with sides 3, 4 and 5 cm is':
    'Adding the three sides gives 3 + 4 + 5 = **12 cm** all the way around the triangle. Answering 60 cm multiplies the sides instead of adding them, and 9 cm leaves out one whole side.',
  'The perimeter of a triangle is':
    'The perimeter is **the sum of its three sides**, the full distance around the triangle. Half the base times height is the area formula, which measures the inside rather than the boundary.',
  'The area of a square of side 9 cm is':
    'Area = side x side = 9 x 9 = **81 square cm**, since nine rows of nine squares fit inside it. Answering 36 square cm uses 4 x 9, the perimeter, which counts length instead of space.',
  'Area is measured in':
    'Area covers a surface, so it is measured in **square units** such as cm2, each one a 1 cm by 1 cm square. Units of length like cm measure a boundary, and cubic units measure volume.',
  'The area of a triangle with base 8 cm and height 5 cm is':
    'Area = (base x height) / 2 = (8 x 5) / 2 = 40 / 2 = **20 square cm**. Leaving out the half gives 40 square cm, which is double the true area of the triangle.',
  'A triangle has base 12 cm and height 3 cm. Its area is':
    '(12 x 3) / 2 = 36 / 2 = **18 square cm**, half the area of the 36 square cm rectangle around it. Answering 36 square cm forgets to halve the product of base and height.',
  'In the fraction 5/9, which number is the denominator?':
    'In 5/9 the number below the line is the **denominator**, so the denominator is 9, naming the 9 equal parts the whole is cut into. Picking 5 reads the top number as the denominator, and 14 comes from adding 5 and 9 instead of naming a part.',
  'Which fraction is greater, 3/5 or 3/8?':
    'With the same numerator 3, the smaller denominator makes bigger pieces, so 3/5 = 0.6 is greater than 3/8 = 0.375, making **3/5** the larger. Choosing 3/8 assumes a bigger bottom number means a bigger fraction, which reverses the rule.',
  'Convert 2 3/4 into an improper fraction.':
    'Multiply the whole 2 by the denominator 4 to get 8, add the numerator 3, and keep 4 underneath, which gives **11/4**. Stopping at 2 x 4 = 8 and forgetting to add the 3 gives 8/4, the commonest slip here.',
  'What is 1/4 + 2/3?':
    'With the common denominator 12 the fractions become 3/12 and 8/12, and 3 + 8 gives **11/12**. Answering 5/7 comes from adding tops and bottoms straight across, which is not how fractions are added.',
  'What is a fractional unit?':
    'A fractional unit is **one equal part of a whole**, such as a single piece of a roti cut into four equal pieces. Calling it a whole number confuses the one part with the entire whole that it came from.',
  'If a roti is cut into 4 equal parts, each part is':
    'Four equal parts mean each piece is 1 out of 4, so each piece is **one-fourth** of the roti and the four pieces rebuild the whole. Saying one-third comes from counting cuts as parts, though 4 parts need only 3 cuts.',
  'In the fraction 3/5, what is the 5 called?':
    'The bottom number of a fraction is the **denominator**, so in 3/5 the 5 is the denominator while the 3 on top is the numerator. Calling it the numerator swaps the two positions, and quotient and remainder belong to division, not to a fraction.',
  'Which fraction is equivalent to 1/2?':
    'Multiplying the top and bottom of 1/2 by 2 gives **2/4**, and dividing both by 2 returns to one half. Picking 1/3 or 2/3 changes the denominator but not the numerator, so the value no longer equals 1/2.',
  'How do you make an equivalent fraction?':
    'Multiplying the numerator and the denominator by the same number keeps the value fixed, so 1/2 becomes **2/4** when both are doubled. Changing the denominator only alters the size of the parts and therefore the value of the fraction.',
  'Which fraction is equivalent to 2/3?':
    'Doubling both parts of 2/3 gives **4/6**, and dividing 4 and 6 by 2 brings it back to 2/3. Picking 2/6 doubles only the denominator, which halves the value instead of preserving it.',
  'In 5/8, the numerator is':
    'The number above the line is the **numerator**, so in 5/8 the numerator is 5 while 8 below is the denominator. Choosing 8 reads the bottom number, and 13 comes from adding the two numbers rather than naming a part.',
  'The denominator of a fraction tells us':
    'The **denominator** counts the equal parts the whole was divided into, so the 8 in 5/8 means the whole was cut into eighths. Saying it tells how many parts we take describes the numerator, which counts the parts chosen.',
  'Which is a mixed fraction?':
    'A **mixed fraction** pairs a whole number with a proper fraction, and 2 1/3 is exactly that: two wholes plus one third. Choosing 7/3 misses the whole part, since 7/3 is improper even though it names the same amount.',
  '7/3 written as a mixed fraction is':
    'Divide 7 by 3: 3 fits twice with 1 left over, so 7/3 = **2 1/3**. Writing 3 1/7 puts the divisor and the remainder into the wrong places, swapping quotient with denominator.',
  'Which is larger: 3/5 or 2/5?':
    'Both fractions are fifths, so compare the counters and 3 fifths is more than 2 fifths, making **3/5** larger. Saying they are equal ignores the different numerators sitting over the same denominator.',
  'Which is smaller: 1/2 or 1/3?':
    'With the same numerator, more parts means smaller parts, so 1/3 = 0.333 is smaller than 1/2 = 0.5, giving **1/3**. Choosing 1/2 assumes a bigger denominator makes a bigger fraction, which reverses the rule.',
  'What is 2/7 + 3/7?':
    'The denominators already match, so add only the numerators, 2 + 3 = 5, and keep the 7, which gives **5/7**. The answer 5/14 adds the denominators as well, doubling the number of parts and halving each one.',
  'To add fractions with different denominators you first':
    'The pieces must be the same size before adding, so first **find a common denominator**, turning 1/4 and 2/3 into 3/12 and 8/12. Adding the denominators creates pieces of a new size and gives a sum with no meaning.',
  'The distance from the centre of a circle to any point on the circle is called its':
    'The **radius** runs from the centre straight out to any point on the circle, and it is half the diameter. Picking the diameter describes the distance right across through the centre, which is twice as long.',
  'The diagonals of a rectangle are always':
    'Both diagonals are hypotenuses of right triangles built on the same length and breadth, so they are always **equal in length**, as with 8 cm and 6 cm giving 10 cm on each. Saying they are perpendicular describes a square, not a general rectangle.',
  'A rectangle is 8 cm long and 6 cm wide. What is the length of each of its diagonals?':
    'Each diagonal is the hypotenuse of a right triangle with legs 8 and 6, so 8^2 + 6^2 = 64 + 36 = 100, and the square root gives **10 cm**. Simply adding 8 and 6 to get 14 cm skips the squaring that Pythagoras demands.',
  'A point P is equidistant from A and B, where AB is 10 cm. P lies on the perpendicular bisector of AB, 12 cm away from the midpoint of AB. What is the distance PA?':
    'P sits above the midpoint M, so AM = 5 cm and PA^2 = 5^2 + 12^2 = 25 + 144 = 169, giving PA = **13 cm**. Answering 12 cm takes only the perpendicular height and ignores the 5 cm run along the segment.',
  'Which tools do you need to construct a square accurately?':
    'A **ruler and a compass** let you mark equal sides and true right angles, because the compass copies a length exactly. A protractor alone measures angles but cannot transfer a side length, so the square would never close.',
  'How many equal sides does a square have?':
    'A **square** has all 4 sides equal plus four right angles, which is what separates it from an ordinary rectangle. Saying 3 describes a triangle, which cannot be a square at all.',
  'In a square, each angle measures':
    'Each of the four corners of a square is **90 degrees**, and 4 x 90 = 360 fills one complete turn about the centre. The value 180 degrees is a straight line rather than a corner of any polygon.',
  'The radius of a circle is the distance from the centre to':
    'The radius reaches from the centre to **any point on the circle**, so every radius of one circle has the same length. Going on to the opposite edge would be the diameter, which is twice the radius.',
  'The diameter of a circle is':
    'The diameter runs through the centre from edge to edge, so it is **twice the radius**, that is d = 2r. Saying half the radius divides instead of multiplying and shrinks the width to a quarter of the truth.',
  'To construct a rectangle you need':
    'A **ruler and a compass or set square** supply the right angles and the equal opposite sides a rectangle needs. A pencil alone cannot fix a 90 degree corner, so the drawing turns into any old quadrilateral.',
  'Each angle of a rectangle is':
    'Every corner of a rectangle is a right angle, so each one measures **90 degrees** and the four add to 360. The choice 60 degrees belongs to the corners of an equilateral triangle.',
  'How many diagonals does a rectangle have?':
    'Joining each of the four corners to the corner opposite gives just **2 diagonals** across the rectangle. Counting 4 treats the two directions of the same join as separate lines, though each diagonal is shared by two corners.',
  'The diagonals of a rectangle':
    'A rectangle\'s diagonals are **equal in length and bisect each other**, meeting at the midpoint of both, which is also its centre. Saying they meet at 45 degrees describes a square, where the diagonals are also perpendicular.',
  'A point equidistant from two given points lies on':
    'Every point on the **perpendicular bisector** is the same distance from both ends of the segment, so that line is the full set of such points. A point on the segment itself sits nearer the closer end unless it is the midpoint.',
  '\'Equidistant\' means':
    '**Equidistant** means at equal distances, as when P is as far from A as it is from B. Reading it as at right angles confuses a distance with the perpendicular direction that often carries the bisector.',
  'How many lines of symmetry does a square have?':
    'A **square** folds onto itself along its 2 diagonals and along 2 lines through the midpoints of opposite sides, making 4 lines of symmetry. The answer 2 counts only the midpoint folds and forgets the two diagonal folds.',
  'What is the angle of symmetry of a regular hexagon?':
    'A regular hexagon matches itself 6 times in a full turn, so the angle is 360 / 6 = **60 degrees**. The choice 30 degrees halves the right answer, which would only suit a 12-sided figure.',
  'A rectangle that is not a square has rotational symmetry of order 2. Where is its centre of rotation?':
    'A rectangle repeats after a half turn about its middle, which is **at the point where its diagonals meet**. A corner cannot be the centre, because a half turn carries each corner to the opposite one.',
  'Which of these letters has a vertical line of symmetry?':
    'The capital **A** folds onto itself along a vertical line down its middle, matching its two sloping strokes. J, F and G all hang their strokes on one side only, so a vertical fold leaves them mismatched.',
  'A figure has rotational symmetry of order 4. What is its angle of rotation?':
    'Order 4 means the figure matches itself 4 times in a full turn, so the angle is 360 / 4 = **90 degrees**. Reporting 45 degrees divides by 8, which is the count for a regular octagon instead.',
  'Why does a circle have infinitely many lines of symmetry?':
    'A circle folds onto itself along **any diameter**, and a circle has infinitely many diameters, so it has infinitely many lines of symmetry. Assuming a fixed count like 2 or 4 forgets that every direction through the centre works.',
  'What is a reflection of a shape?':
    'A reflection is the **mirror image** of a shape, produced by flipping it across a line so that left and right swap. Calling it the shape turned around describes rotation, where the shape pivots about a point instead.',
  'When a shape is reflected in a mirror line, its size':
    'A reflection is a flip, so every length is preserved and the **size stays the same** while the orientation reverses. Saying it becomes double confuses reflection with enlargement by a scale factor of 2.',
  'A reflection is also called':
    'A reflection is also called a **flip**, because the shape flips over the mirror line to the other side. Calling it a slide describes a translation, where the shape moves without being turned over.',
  'What is rotational symmetry?':
    '**Rotational symmetry** means a shape looks the same after a turn of less than a full circle about a point, as a square does every 90 degrees. Describing it as having a mirror line confuses rotation with reflection, which is a fold and not a turn.',
  'How many times does a square look the same during one full turn?':
    'A square matches itself after 90, 180, 270 and 360 degrees, so it looks the same **4** times in one full turn. Saying 2 counts only the half turn and misses the two quarter turns.',
  'A shape with rotational symmetry must have':
    'Any shape that rotates onto itself must pivot about a fixed point, so it needs a **centre of rotation**. Four equal sides are neither necessary nor enough, since a rectangle with unequal sides also has rotational symmetry.',
  'A line of symmetry divides a shape into':
    'A line of symmetry splits a shape into **two identical halves** that fold exactly onto each other. Saying two different halves contradicts the fold test, because mismatched halves would not coincide.',
  'The angle of rotational symmetry of a square is':
    'The square repeats every quarter turn, so its angle of rotational symmetry is 360 / 4 = **90 degrees**. Choosing 360 degrees describes a shape with no rotational symmetry, which only matches after a complete turn.',
  'The centre of rotation of a rectangle is':
    'A rectangle repeats after a half turn about its middle, so its centre of rotation is **the point where its diagonals meet**. A corner or the middle of a side moves to a new place under that turn, so neither can be the fixed centre.',
  'A shape has rotational symmetry if it looks the same':
    'The defining test is a turn of less than 360 degrees that leaves the shape unchanged, so it matches **after a turn of less than 360 degrees**. Saying only after a full turn is true of every shape and would make the idea empty.',
  'A circle has how many lines of symmetry?':
    'Every diameter of a circle is a fold line that maps it onto itself, so there are **infinitely many** lines of symmetry. Answering four borrows the square\'s count and ignores the circle\'s endless possible directions.',
  'The centre of rotation of a circle is':
    'A circle turns onto itself about **its centre** by any angle at all, which is why it has rotational symmetry of every order. A point on the edge swings away from where it started, so it cannot be the fixed point.',
  'Which of these is the greatest integer?':
    'On a number line 3 sits furthest right, and 3 > 0 > -2 > -7, so **3** is the greatest of them. Choosing -7 counts the biggest distance from zero as the biggest number, but negatives are the smallest integers.',
  'What is the additive inverse of −9?':
    'The additive inverse is the number that makes the sum zero, and -9 + **9** = 0, so the answer is 9. Picking 1/9 confuses the additive inverse with the reciprocal, which is what you multiply by to get 1.',
  'Find the value of (−6) + 4.':
    'Start at -6 on the number line and move 4 places right, landing on **-2**, because 6 - 4 = 2 and the negative sign is kept. A common slip is to add the sizes to get 10 or to drop the sign, but opposite signs subtract.',
  'A shopkeeper has a credit of ₹250 and a debit of ₹400. What is her net balance?':
    'The net balance is 250 - 400 = -150, which is a **debit of Rs 150** because the debit is the larger amount. Choosing a debit of Rs 650 adds the two amounts instead of subtracting them, which counts the money twice.',
  'What is -3 + 5?':
    'Move 5 places right from -3 on the number line and you land on **2**, because 5 - 3 = 2 and the larger move is positive. Picking -8 adds the sizes and keeps the negative sign, giving the wrong direction and the wrong size.',
  'On a number line, negative numbers lie to the ___ of zero.':
    'Negative numbers are less than zero, so on a horizontal number line they lie to the **left** of zero. Saying right reverses the order, since values grow as you move right and shrink as you move left.',
  'What is a zero pair?':
    'A zero pair is two numbers of equal size and opposite sign, so their sum is **zero**, like 5 and -5. Two equal numbers such as 4 and 4 add to 8 and not to 0, so matching the digits alone is not enough.',
  'Which of these is a zero pair?':
    '3 and **-3** are equal in size but opposite in sign, and 3 + (-3) = 0, so together they cancel. The pair 3 and -2 differs in size as well as sign and adds to 1, so it never makes zero.',
  'What is the sum of a zero pair?':
    'By definition the two members of a zero pair have the same size and opposite signs, so their sum is **0**, as in -11 + 11 = 0. Choosing the larger number ignores the cancellation, which is the whole point of the pair.',
  'Which is smaller: -8 or -3?':
    'On the number line **-8** lies further left than -3, so -8 is the smaller integer. Reading 8 as bigger than 3 and keeping that order forgets that a larger digit after the minus sign makes a smaller number.',
  'The additive inverse of 7 is':
    'Adding **-7** to 7 gives 7 + (-7) = 0, so -7 is the additive inverse of 7. Choosing 1/7 gives the reciprocal instead, which multiplies to 1 rather than adding to 0.',
  'A number plus its additive inverse equals':
    'An additive inverse is chosen so that it cancels the number exactly, so n + (-n) = **0** for every integer. Picking twice the number forgets the sign change, and 7 + 7 gives 14 rather than 0.',
  'Integers include':
    'Integers are 0, 1, 2, 3 and so on together with -1, -2, -3, so the set is **whole numbers and their negatives**. Saying only positive numbers leaves out zero and every negative, which are integers too.',
  'Which of these is an integer?':
    '**-4** is a whole number carrying a minus sign, so it belongs to the integers, whereas 1/2, 0.5 and 2.75 all sit between integers. Treating 0.5 as an integer confuses a short decimal with a whole number.',
  'On a number line, numbers to the right are':
    'Values increase from left to right, so numbers to the right of a point are **greater** than it. Calling them smaller reverses the order, which would make 5 less than 2 and put the arrow the wrong way.',
  'On a number line, moving left means':
    'Each step left lowers the value by 1, so moving left is **subtracting**. Calling it adding would take you right instead, turning 4 into 5 rather than into 3.',
  'In a bank account, a debit is shown as':
    'A debit takes money out, so it is recorded as a **negative number**, while a credit is positive. Writing the debit as positive makes a withdrawal look like a deposit and reverses the balance.',
  'A credit of 500 rupees followed by a debit of 200 rupees leaves':
    '500 - 200 = **300 rupees**, and the balance stays a credit because more came in than went out. Answering 700 adds the debit instead of taking it away, and -300 flips a positive balance into a debt.',
  'In the number 7,45,238, what is the place value of the digit 4?':
    'Reading from the right, 7,45,238 has 4 in the ten thousands place, so its place value is 4 x 10,000 = **40,000**. Calling it 4,00,000 moves the digit into the lakh place, one place too far left.',
  'How is 3,05,040 written in words?':
    'Split the numeral as 3 lakh + 05 thousand + 040, which reads **three lakh five thousand forty**. Saying three lakh fifty thousand forty turns the 5 of the thousands place into 50 thousand.',
  'Round 6,84,950 to the nearest thousand.':
    'The hundreds digit is 9, which is 5 or more, so the thousands digit 4 rounds up and 6,84,950 becomes **6,85,000**. Keeping 6,84,000 treats 950 as closer to the lower thousand, though it is only 50 short of 6,85,000.',
  'Without multiplying fully, how many digits are there in the product 25 × 400?':
    '25 x 400 = 25 x 4 x 100 = 100 x 100 = 10,000, which has **5 digits**. Saying 4 digits assumes the product stays under 10,000, but it lands exactly on 10,000 and needs the extra place.',
  'What is 3,87,69,957 rounded to the nearest lakh?':
    'The digit after the lakhs place is 6, which is 5 or more, so the lakhs digit 7 rounds up to 8 and every lower digit becomes 0, giving **3,88,00,000**. Choosing 3,87,00,000 rounds down even though 69,957 is well past half a lakh.',
  'Using 125 = 1000 ÷ 8, what is 72 × 125?':
    '72 x 125 = 72 x 1000 / 8 = 72,000 / 8 = **9,000**. Answering 900 divides by 80 instead of 8, which is a slip in the chain of halvings of the shortcut rule.',
  'In the Indian system, 10 lakh makes one':
    'Ten lakhs group together as one **crore**, since 10,00,000 x 10 = 1,00,00,000. Calling it a million applies the international scale, where 10 lakh equals one million rather than ten.',
  'In 4,52,317 the digit 5 stands for':
    'The digit 5 sits in the ten thousands place, so it stands for 5 x 10,000 = **fifty thousand**. Reading it as five thousand moves it one place right, which is where the 2 actually sits.',
  'Which numeral means \'seven lakh twenty\'?':
    'Seven lakh fills the lakh place and twenty fills the tens and units, so the numeral is **7,00,020** with zeros in the thousands and hundreds. Writing 7,20,000 puts the 2 in the ten thousands place and reads as seven lakh twenty thousand.',
  'Round 6,847 to the nearest hundred.':
    'The tens digit is 4, which is less than 5, so the hundreds digit stays and **6,800** is the nearest hundred. Choosing 6,900 rounds up although 47 is closer to 0 than to 100 on the hundred scale.',
  'When rounding to the nearest ten, a units digit of 5 means we round':
    'A units digit of 5 is exactly halfway, and the usual rule rounds it **up** to the next ten, so 45 becomes 50. Rounding down would put 45 at 40 and break the half-up convention used for whole numbers.',
  'The two nearest hundreds around 4,362 are':
    '4,362 lies between the hundreds **4,300** and 4,400, since 62 is the part above 4,300. Naming 4,000 and 5,000 picks the nearest thousands, which are far away on either side.',
  'Which number lies between 2,700 and 2,800?':
    '**2,750** is greater than 2,700 and less than 2,800, so it sits inside the interval. The value 2,690 falls below 2,700 and 2,810 above 2,800, so neither of them lies between.',
  'What is 25 x 16 using a shortcut?':
    'Rewrite 16 as 4 x 4, so 25 x 16 = 25 x 4 x 4 = 100 x 4 = **400**. Answering 256 squares 16 instead of multiplying it by 25, and 410 comes from adding 10 to 400.',
  'Multiplying by 5 is the same as multiplying by 10 and then':
    'Since n x 5 = n x 10 / 2, multiplying by 10 and then **halving** gives the same answer, as 14 x 5 = 140 / 2 = 70. Choosing doubling multiplies by 20 instead, which is four times too big.',
  'A 3-digit number multiplied by a 2-digit number gives a product with at most':
    'The largest case is 999 x 99 = 98,901, which has **5 digits**, so a 3-digit by 2-digit product never exceeds five places. Saying 6 digits ignores the size of the factors, since even 999 x 99 stays below 1,00,000.',
  'The product of 99 and 99 has how many digits?':
    '99 x 99 = 99 x (100 - 1) = 9,900 - 99 = **9,801**, which has 4 digits. Guessing 3 digits underestimates the product, since 99 x 99 sits just under 100 x 100 = 10,000.',
  'Which numeral means \'five lakh six thousand\'?':
    'Five lakh goes in the lakh place and six thousand in the thousands place, with zeros for the hundreds, tens and units, giving **5,06,000**. Writing 5,60,000 reads the six as sixty thousand instead of six thousand.',
  'What is the value of 20 + 4 × 5?':
    'Multiplication is done before addition, so 4 x 5 = 20 and 20 + 20 = **40**. Answering 120 works left to right and multiplies 24 by 5, which ignores the order of operations.',
  'Simplify 15 − (6 + 4).':
    'The bracket is worked first: 6 + 4 = 10, and then 15 - 10 = **5**. Answering 13 subtracts only the 6 and leaves the 4 alone, which ignores the bracket around the whole sum.',
  'Use the distributive property to find 6 × 98.':
    '6 x 98 = 6 x (100 - 2) = 600 - 12 = **588**. A common slip is to work 6 x 100 - 2 = 598 and subtract the 2 only once instead of six separate times, one for each hundred.',
  'Which expression has the greater value, and what is that value?':
    '(8 + 3) x 4 = 11 x 4 = **44**, while 8 + 3 x 4 = 8 + 12 = 20, so the bracketed form is larger. Treating both as equal to 44 forgets that without brackets only the 3 is multiplied by 4.',
  'How many terms are there in the expression 5x + 3y - 7?':
    'The expression splits at each plus or minus sign into 5x, 3y and -7, so there are **3** terms. Counting 4 treats the minus sign as starting a new term instead of attaching it to the 7.',
  'What is a term of an algebraic expression?':
    'A term is one block of the expression, cut off by the plus and minus signs, so 4a and **6b** are the two terms of 4a + 6b. Saying a letter only describes a variable, which is merely one piece of a term like 6b.',
  'In 4a + 6b, what are the numbers 4 and 6 called?':
    'The number multiplying a variable is its **coefficient**, so 4 is the coefficient of a and 6 of b. Calling them constants confuses a fixed number with the fixed multiplier of a varying quantity.',
  'What is the value of 3 + 4 x 2?':
    'Multiply first: 4 x 2 = 8, and then 3 + 8 = **11**. Answering 14 adds 3 and 4 before multiplying, which breaks the rule that multiplication comes before addition.',
  'What is the value of (3 + 4) x 2?':
    'The bracket makes the sum first: 3 + 4 = 7, and then 7 x 2 = **14**. Answering 11 multiplies 4 by 2 first and ignores the bracket, which is placed there to override that usual order.',
  'Which is larger: 2 + 3 x 4 or (2 + 3) x 4?':
    '2 + 3 x 4 = 14 while (2 + 3) x 4 = 5 x 4 = **20**, so the bracketed expression is larger. Calling them equal ignores that brackets change which operation is carried out first.',
  'Which expression equals 20?':
    '4 x (2 + 3) = 4 x 5 = **20**. The expression 4 x 2 + 3 multiplies first and gives 11, and 4 + 2 x 3 gives 10, so neither of them reaches 20.',
  'Simplify 5 x (20 + 3).':
    '5 x (20 + 3) = 5 x 23 = **115**, or 100 + 15 when you distribute. Answering 103 multiplies only the 20 by 5 and adds the 3 once, leaving the 3 undistributed.',
  'Simplify 8 x (10 - 4).':
    'The bracket gives 10 - 4 = 6, so 8 x 6 = **48**. Answering 76 works 80 - 4 and subtracts the 4 once instead of eight times, which the distributive rule requires.',
  'Which shows the distributive property?':
    'Distributing multiplies the outside factor by each term inside, so 6 x (7 + 2) = 6 x 7 + 6 x 2 = 42 + 12 = **54**. The statement 6 x 7 = 7 x 6 shows commutativity, which swaps the factors without distributing anything.',
  'Use the distributive property: 12 x 99 =':
    '12 x 99 = 12 x (100 - 1) = 1200 - 12 = **1188**. Answering 1088 subtracts 100 instead of 12, misplacing the value of the 1 that is being taken away from 100.',
  'How many hundredths are there in 0.7?':
    '0.7 is 7 tenths, and each tenth is 10 hundredths, so 0.7 = 7 x 10 = **70** hundredths. Answering 7 counts only the tenths digit and misses the extra place the zero adds.',
  'In 4.382, which digit is in the hundredths place?':
    'The places after the point run tenths, then hundredths, then thousandths, so in 4.382 the **8** is the hundredths digit. Picking 2 reads the very last digit and lands on thousandths instead.',
  'Write 7 rupees 5 paise as a decimal number of rupees.':
    '5 paise is 5/100 of a rupee, so the paise part needs two places: **7.05** rupees, with 0 holding the tenths place. Writing 7.5 means 50 paise, ten times the 5 paise asked for.',
  'Which of these decimals is the largest?':
    'Compare tenths first: 0.8 has 8 tenths while 0.78 and 0.708 have only 7, so **0.8** is the largest. Picking 0.78 assumes a longer decimal is a bigger one, confusing more digits with more value.',
  'How many millimetres are there in 1 centimetre?':
    'A centimetre is one hundredth of a metre and a millimetre one thousandth, so 1 cm = 1000/100 = **10** mm. Choosing 1000 treats a centimetre as if it were a whole metre.',
  'How many centimetres are there in 1 metre?':
    'The prefix centi means a hundredth, so one metre contains exactly **100** centimetres. Giving 10 confuses centi with deci, which is the tenth part.',
  '45 mm is the same as':
    'Millimetres to centimetres is a jump of ten, so 45 / 10 = **4.5 cm**. Answering 450 multiplies by 10 instead of dividing, moving the point the wrong way.',
  'Where does 0.5 lie on a number line?':
    '0.5 is the fraction 5/10, which is one half, so the mark sits **halfway between 0 and 1**. Placing it at 5 forgets that digits after the point name parts smaller than one whole.',
  'Which decimal comes between 0.3 and 0.5?':
    '0.3 is 30 hundredths and 0.5 is 50, so **0.4**, which is 40 hundredths, lies between them. Choosing 0.2 falls below 0.3 because 2 tenths is a smaller share, not a middle one.',
  'Which of these numbers is the largest?':
    'Each extra zero pushes the 7 one place right, so 0.7 = 7 tenths while 0.07 = 7 hundredths, making **0.7** the largest. Picking 0.0007 assumes the longest string is the biggest number.',
  'How many hundredths are there in 0.37?':
    '3 tenths is 30 hundredths, so 0.37 holds 30 + 7 = **37** hundredths. Answering 3 stops at the tenths digit and ignores the 7 in the next place.',
  '0.5 is the same as':
    'There is one digit after the point, in the tenths place, so 0.5 is **5 tenths**, that is 5/10. Calling it 5 hundredths shifts the digit one place right and makes it ten times smaller.',
  'In 4.26, the digit 2 is in the':
    'After the point the places are tenths then hundredths, so the 2 in 4.26 sits in the **tenths** place. Naming the tens place looks at digits before the point, on the wrong side.',
  'In 4.26, the digit 6 has value':
    'The 6 is second after the point, so its place value is 6/100, that is **6 hundredths**. Saying 6 tenths borrows the value of the 2 standing to its left.',
  'How do we write 7 rupees 5 paise as a decimal?':
    'Paise take the two places after the point, so 5 paise is written 05 and the amount is **7.05**. Choosing 7.50 gives fifty paise, ten times too much.',
  'How many paise are there in 2.35 rupees?':
    'One rupee is 100 paise, so 2.35 x 100 = **235** paise, the point moving two places right. Giving 35 reads only the decimal part and drops the two whole rupees.',
  'Which is larger: 0.6 or 0.58?':
    'Written to hundredths, 0.6 = 0.60 and 60 beats 58, so **0.6** is larger. Choosing 0.58 goes by the longer string, but that extra digit does not add value.',
  'Which is the smallest: 1.2, 1.02, 1.20, 1.22?':
    'All four have 1 as the whole part, so compare hundredths: 1.02 has 2, while 1.2 = 1.20 has 20, making **1.02** the smallest. Calling 1.2 smallest mistakes a short decimal for a small one.',
  'How is 7 × n written in algebra?':
    'A number written just before a letter means multiplication, so 7 x n becomes **7n**. Writing n7 reverses that convention, and 7 + n changes the operation to addition.',
  'Which pair of terms are like terms?':
    'Like terms must share the same letter part, and **3x and 5x** both carry x, so they combine to 8x. The pair 3x and 3y differs in the letter and cannot be added that way.',
  'A pattern is 4, 7, 10, 13, ... Write the rule for its nth term.':
    'Each term rises by 3 and the first is 4, which is 3 x 1 + 1, so the rule is **3n + 1**. A rule of 4n would step by 4 and give 8 where the pattern has 7.',
  'The number of matchsticks in a row of n squares is given by 3n + 1. How many matchsticks make a row of 12 squares?':
    'Put n = 12 into 3n + 1: 3 x 12 = 36, then 36 + 1 = **37** sticks. Answering 36 drops the extra stick that the + 1 contributes to every row, and 39 comes from 3 x 13.',
  'What is a letter-number in algebra?':
    'A letter-number such as n stands in for an unknown **number** whose value can change. Treating it as a letter with no value leaves nothing to substitute into the expression.',
  'If n stands for a number, what does 3n mean?':
    'A digit beside a letter means multiplication, so 3n = 3 x n, that is **3 times the number**. Reading it as the number plus 3 mixes the hidden times sign with a plus.',
  'If x = 4, what is the value of x + 5?':
    'Replace x with 4, giving **4 + 5 = 9**. Getting 45 glues the two numerals together as if multiplying, though the sign between them is a plus.',
  'Which of these is an algebraic expression?':
    'An expression needs at least one letter, and **2x + 3** contains x beside a number. The sum 2 + 3 has only numbers, so nothing in it can vary.',
  'The formula for the perimeter of a square with side s is':
    'A square has four equal sides, so the perimeter is s + s + s + s = **4s**. Writing s x s gives the area, which measures surface rather than the boundary.',
  'What is a formula?':
    'A formula is a general rule such as P = 4s, with letters standing for **numbers** you can replace. Calling it an instrument confuses the rule with the ruler used to test it.',
  'Which two are like terms?':
    '**3x and 7x** share the same letter x raised to the same power, so they add to 10x. The pair 3x and 3x^2 has different powers and cannot be combined.',
  'Simplify 4a + 3a.':
    'Keep the letter and add the numbers in front: 4 + 3 = 7, so the answer is **7a**. Giving 12a multiplies those coefficients instead of adding them.',
  'What does 5m mean?':
    'The 5 in front multiplies the letter, so 5m means **5 times m**, and with m = 3 it gives 15. Reading it as 5 plus m treats the invisible times sign as an addition, which would give 8.',
  'How is \'x multiplied by y\' written?':
    'Two letters written together are multiplied, so x times y is written **xy**. Writing x + y keeps them apart with a plus, which makes a sum, not a product.',
  'The pattern 2, 4, 6, 8 is generalised as':
    'Every term is double its position: n = 1 gives 2 and n = 4 gives 8, so the rule is **2n**. The rule 2n + 1 would give odd numbers 3 and 5 instead.',
  'A matchstick pattern uses 3 sticks per shape plus 1 extra. For n shapes the sticks are':
    'Three sticks for each shape plus 1 extra means multiply then add, giving **3n + 1**. Writing n + 3 makes the 3 a single extra rather than three per shape.',
  'If x = 5, the value of 2x + 3 is':
    'Work out 2x first, so 2 x 5 = 10, then add 3 to get **13**. Answering 8 adds 5 and 3 and forgets the doubling, while 10 stops before the final addition.',
  'To check whether 3(n + 1) equals 3n + 3, you can':
    'Try n = 1, 2 and 5: both sides give 6, 9 and 18 each time, so **substituting several values** tests the claim. Multiplying both sides by zero always gives 0 = 0 and proves nothing.',
  'Two straight lines cross each other. One of the angles formed is 65°. What is the vertically opposite angle?':
    'Angles opposite each other at a crossing come from the same two lines, so the angle facing **65 degrees** is also 65 degrees. Choosing 115 degrees subtracts from 180 and describes the neighbour on the straight line.',
  'Two angles on a straight line are in the ratio 1 : 2. What is the larger angle?':
    'Split the straight angle of 180 degrees into 1 + 2 = 3 parts, so each part is 60 and the larger is 2 x 60 = **120 degrees**. Answering 60 degrees takes the smaller share instead.',
  'A transversal cuts two parallel lines. One of a pair of alternate angles is 72°. What is the other alternate angle?':
    'A transversal across parallel lines makes alternate angles equal, so the partner of 72 degrees is **72 degrees**. Writing 108 degrees treats them as a pair adding to 180, a rule for neighbours.',
  'Two parallel lines are cut by a transversal. One angle is 110°. What is the angle that lies next to its corresponding angle on the same straight line?':
    'The corresponding angle is also 110 degrees, and its partner on the straight line is 180 - 110 = **70 degrees**. Choosing 110 degrees repeats the first angle without moving along the line.',
  'Two lines that meet at a right angle are called':
    'Two lines meeting at a right angle of 90 degrees are called **perpendicular lines**. The parallel label belongs to lines that never meet, so they cannot form that corner.',
  'What is the angle between two perpendicular lines?':
    'Perpendicular means at a right angle, so the angle is exactly **90 degrees**. Answering 45 degrees halves the right angle, and 180 degrees is a straight line.',
  'Which letter shape shows perpendicular lines?':
    'The letter **L** has one upright and one base meeting at a square corner, so it shows perpendicular lines. The letter C is a curve with no straight right-angled meeting.',
  'Parallel lines are lines that':
    'Parallel lines keep a constant direction, so they **never meet** no matter how far they are drawn. Saying they cross once actually describes intersecting lines.',
  'Which of these is an example of parallel lines?':
    'The **two rails of a railway track** stay the same distance apart all along, which is what parallel means. The letter L shows two lines meeting at a corner, not running alongside.',
  'What is the distance between two parallel lines?':
    'The gap between parallel lines never widens or narrows, so the distance is **the same everywhere**. Saying it differs at each point describes lines that lean towards each other.',
  'Vertically opposite angles are':
    'The two angles facing each other at a crossing are always **equal** in size. Calling them supplementary borrows the rule for angles side by side on a straight line.',
  'Two lines cross and one angle is 40 degrees. The vertically opposite angle is':
    'The angle opposite the 40 degree one is made by the same pair of lines, so it is also **40 degrees**. Choosing 140 degrees subtracts from 180 and gives the neighbouring angle.',
  'Angles in a linear pair add up to':
    'A linear pair forms a straight angle, and a straight line measures **180 degrees**. Answering 90 degrees describes a right angle, which is only half the straight line.',
  'If one angle of a linear pair is 65 degrees, the other is':
    'Subtract from the straight angle: 180 - 65 = **115 degrees**. Repeating 65 degrees assumes the two are vertically opposite, but a linear pair shares a line.',
  'When two parallel lines are cut by a transversal, corresponding angles are':
    'Across parallel lines the transversal slants equally at both, so **corresponding angles are equal**. Calling them supplementary mixes them up with the same-side interior pair.',
  'Corresponding angles lie on':
    'Corresponding angles sit in matching positions on the two parallel lines, so they are on **the same side of the transversal**. Opposite sides describes the alternate pair instead.',
  'Alternate interior angles between parallel lines are':
    'Alternate interior angles lie on opposite sides of the transversal with equal slant, so they are **equal**. Calling them supplementary is the rule for the same-side interior pair.',
  'Alternate angles lie on':
    'The alternate pair takes **opposite sides of the transversal**, one at each parallel line. The same side describes the co-interior pair, which adds to 180 degrees.',
};
