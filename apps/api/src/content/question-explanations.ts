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
  'ABCD is a cyclic quadrilateral with âˆ A = 95Â° and âˆ B = 70Â°. Find âˆ C and âˆ D.':
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
  'Using Ï€ = 22/7, what is the circumference of a circle of radius 7 cm?':
    'Circumference = 2 pi r = 2 × 22/7 × 7 = **44 cm**, because the two 7s cancel. The 154 cm is pi r^2 = 22/7 × 49, which is the area and is measured in square units. Getting 22 cm uses pi r only once, as if you had gone around only half the circle.',
  'A sector of a circle of radius 21 cm has a central angle of 60Â°. Find the area of the sector. (Use Ï€ = 22/7)':
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
  'The nth term of a sequence is given by t(n) = 3n âˆ’ 2. What is the 10th term?':
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
};
