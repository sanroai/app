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
};
