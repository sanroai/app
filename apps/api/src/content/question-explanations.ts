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
};
