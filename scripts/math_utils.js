// ============================================================================
//   MATH_UTILS.JS - Core Mathematical Engine & Solver
// ============================================================================

// --- HELPER FUNCTIONS ---

export function randInt(m, M) {
    return Math.floor(Math.random() * (M - m + 1)) + m;
}

export function extract_random_element(list) {
    const l_min_1 = list.length - 1;
    const random_index = randInt(0, l_min_1);
    const element = list[random_index];
    list[random_index] = list[l_min_1];
    list.pop();
    return element;
}

// --- EXPRESSION TREE CLASS ---

export class Expression {

    //           | Name             | Notes                                        |
    //-----------|------------------|----------------------------------------------|
    // OP === -1 | BASIC EXPRESSION | Just a value. The ones and only leafs        | 
    // OP ===  0 | SUM              |                                              |
    // OP ===  1 | SUBTRACTION      | Left value always greater than right value   |
    // OP ===  2 | MULTIPLICATION   |                                              |
    // OP ===  3 | DIVISION         | Left value always a multiple of right value  |
    //-----------|------------------|----------------------------------------------|

    operation = ['+', '-', '×', '/'];

    constructor(value = null, operation = -1, left = null, right = null) {
        
        // Operation attributes
        this.op = operation;
        // Those attributes depend on this.op and help reduce future calculations
        this.op_sign = this.op >= 2 ? 1 : (this.op >= 0 ? -1 : 0);
        this.op_dir = this.op % 2 === 0 ? 0 : 1;

        // Sons attributes
        this.left = left;
        this.right = right;

        // Values attributes
        this.value = value;
        if(!value) this.calculate_number();

        //  This attribute avoids doing redundant calculations
        //  e.g. 4 - 2 = 2, but we already have the 2, so this is pointless. 
        this.all_values_expr = [];
        this.value_already_in_sons = false;
        if (this.op !== -1) {
            this.all_values_expr.push(...this.left.all_values_expr, ...this.right.all_values_expr);
            this.value_already_in_sons = this.all_values_expr.includes(this.value);
        }        
        this.all_values_expr.push(this.value);

        /*                   |  op_Sign === -1 (SUM, SUBTRACTION) | op_Sign === 1 (MULTIPLICATION, DIVISION)
        Direct expressions   |  Positive expressions              | Numerator expressions 
        Opposete expressions |  Negative expressions              | Denominator expressions

        Direct expressions and opposete expressions are commutative within each 
        */
        this.dir_hashes = []; 
        this.opp_hashes = [];
        this.dir_opp_creation();
 
        // Hash element. If two expressions have the same hash, they are equivalent
        // num_leafs. Number of basic expressions to 
        this.hash = `B:${this.value}`;
        this.num_leafs = 1;
        this.depth = 0;
        if (this.op !== -1) {
            this.dir_hashes.sort();
            this.opp_hashes.sort();
            this.hash = `s:${this.op_sign_string()}(D:[${this.dir_hashes.join(`,`)}],O:[${this.opp_hashes.join(`,`)}])`;
            this.num_leafs = this.left.num_leafs + this.right.num_leafs;
            this.depth = Math.max(this.left.depth, this.right.depth) + 1;
        }
    }

    calculate_number() {
        if (this.op === -1) return;
        const leftValue = this.left.value;
        const rightValue = this.right.value;
        if (this.op_sign === -1) {                                      //                  (op_sign, op_dir)
            if (this.op_dir === 0) this.value = leftValue + rightValue; // SUM              (     -1,      0)
            else this.value = leftValue - rightValue;                   // SUBTRACTION      (     -1,      1)
        } else {                                                        // BASIC EXPR       (      0,      1)
            if (this.op_dir === 0) this.value = leftValue * rightValue; // MULTIPLICATION   (      1,      0)
            else this.value = leftValue / rightValue;                   // DIVISION         (      1,      1)
        }
    }

    dir_opp_creation() {

        if (!this.op_sign) return;

        if(this.op_sign != this.left.op_sign){
            this.dir_hashes.push(this.left.hash);
        }else{
            this.dir_hashes.push(...this.left.dir_hashes);
            this.opp_hashes.push(...this.left.opp_hashes);
        }

        if(this.op_sign !== this.right.op_sign){
            if (this.op%2 === 1) {
                this.opp_hashes.push(this.right.hash);
            } else {
                this.dir_hashes.push(this.right.hash);
            }
        } else {
            if (this.op%2 === 1) {
                this.opp_hashes.push(...this.right.dir_hashes);
                this.dir_hashes.push(...this.right.opp_hashes);
            } else {
                this.dir_hashes.push(...this.right.dir_hashes);
                this.opp_hashes.push(...this.right.opp_hashes);
            }
        }
    }

    op_string() {
        if (this.op === -1) return 'None';
        return this.operation[this.op];
    }

    op_sign_string(){
        switch (this.op_sign){
            case -1: return "+";
            case  0: return "N";
            case  1: return "×";
        }
        return "";
    }

    developed_string() {
        if (this.op === -1) return this.value.toString();
        return '(' + this.left.developed_string() + ' ' + this.op_string() + ' ' + this.right.developed_string() + ')';
    }
}

// --- REACHABLE VALUES SEARCH ALGORITHM ---

export class ReachableValuesSeacher {

    constructor(base_set) {
        
        const basic_elements = [...base_set.sort((a, b) => a.value - b.value)];
        
        const baseSet_len = base_set.length;
        const num_subsets = (1 << baseSet_len) - 1;

        this.possible_outcomes = Array(1 << baseSet_len);
        this.reachable_values = new Map();

        // We first add the subsets of 1 element.

        for( let i = 0; i< baseSet_len; i++){
            const mask = 1 << i;
            const currentMap = new Map();
            this.possible_outcomes[mask] = currentMap;
            const expression = basic_elements[i];
            currentMap.set(expression.hash, expression);
            this.add_reachable_value(expression);
        }

        // Now we create the subsets with more than one element, ordered by 
        // number of elements, starting with k = 2. 

        const num_non_trivial_subsets = num_subsets - baseSet_len;
        const subsets = Array(num_non_trivial_subsets);

        let i = 0;
        for (let k = 2; k <= baseSet_len; k++) {
            let mask = (1 << k) - 1;

            while (mask < (1 << baseSet_len)) {
                subsets[i] = mask;
                i++;

                // Gosper's hack: next mask with exactly k bits set
                const c = mask & -mask;
                const r = mask + c;
                mask = (((r ^ mask) >>> 2) / c) | r;
            }
        }

        // This mask will help us detect wheather there are multuiple equal elements on the base set
        let mult_elem_mask = 0; 
        for (let x = 0; x < baseSet_len-1; x++) {
            if (basic_elements[x].value === basic_elements[x+1].value) {
                mult_elem_mask |= 1 << x;
            }
        }

        for (let i = 0; i < num_non_trivial_subsets; i++) {

            let curr_mask = subsets[i];
            let counter_mask;

            // In case of multiple elements, this flag detects if we already had this subset in consideration
            // if the couter mask isn't 0, then curr_mask ^ (counter_mask | (counter_mask << 1)) will swap 
            // all 10 detected to 01. We only detect those 10 that correspond to consecutive equal elements. 
            if (counter_mask = mult_elem_mask & (curr_mask >> 1) & ~curr_mask) {
                this.possible_outcomes[curr_mask] =
                    this.possible_outcomes[curr_mask ^ (counter_mask | (counter_mask << 1))];
                continue;
            }

            const currentMap = new Map();
            this.possible_outcomes[curr_mask] = currentMap;

            let leading_bit = 1 << (baseSet_len - 1);
            for (; !(curr_mask & leading_bit) && leading_bit > 0; leading_bit = leading_bit >> 1);

            for (let left_subset = (curr_mask - 1) & curr_mask;  left_subset >= leading_bit; left_subset = (left_subset - 1) & curr_mask) {
                
                const right_subset = curr_mask ^ left_subset; 

                const left_outcomes  = this.possible_outcomes[left_subset];
                const right_outcomes = this.possible_outcomes[right_subset];

                for (let left_expression of left_outcomes.values()) {
                    for (let right_expression of right_outcomes.values()) {
                        for (let expression of this.give_new_expressions(left_expression, right_expression)) {
                            if (!currentMap.has(expression.hash)) {
                                currentMap.set(expression.hash, expression);
                                this.add_reachable_value(expression);
                            }
                        }
                    }
                }

            }
        }
    }

    add_reachable_value(expression) {
        const eValue = expression.value;
        if (this.reachable_values.has(eValue)) this.reachable_values.get(eValue).push(expression);
        else  this.reachable_values.set(eValue, [expression]);
    }

    *give_new_expressions(nFirst, nSecond) {
        
        let firstValue = nFirst.value;
        let secondValue = nSecond.value;
        
        let eSum = new Expression(null, 0, nFirst, nSecond); // SUM
        if (!eSum.value_already_in_sons) yield eSum;

        if (nFirst.value > nSecond.value) {
            let eSub = new Expression(null, 1, nFirst, nSecond); // SUBTRACTION
            if (!eSub.value_already_in_sons) yield eSub;
        } else if (nSecond.value > nFirst.value) {
            let eSub = new Expression(null, 1, nSecond, nFirst); // SUBTRACTION
            if (!eSub.value_already_in_sons) yield eSub;
        }

        if (firstValue === 1 || secondValue === 1) return;

        let eMult = new Expression(null, 2, nFirst, nSecond); // MULTIPLICATION
        if (!eMult.value_already_in_sons) yield eMult;

        
        if (nFirst.value % nSecond.value === 0) {
            let eDiv = new Expression(null, 3, nFirst, nSecond); // DIVISION
            if (!eDiv.value_already_in_sons) yield eDiv;

        } else if (nSecond.value % nFirst.value === 0) {
            let eDiv = new Expression(null, 3, nSecond, nFirst); // DIVISION
            if (!eDiv.value_already_in_sons) yield eDiv;
        }
    }

}

// --- BASE SET GENERATOR ---

export class BaseSetManager {
    
    constructor (num_elem = 6) {
        this.num_elem = num_elem;
        this.baseSet = new Array(num_elem);
        this.populateBaseSet();
    }

    populateBaseSet(){
        
        // We first generate the base pool of numbers
        const simple = [];
        const medium = [];
        const tenmul = [];
        const complex = [];
        for (let i = 1; i <= 100; i++) {
             if (i <= 10)         simple.push(...[i, i]); 
             else if (i%25 == 0)  medium.push(...[i]);
             else if (i%10 === 0) tenmul.push(...[i]);
             else                 complex.push(...[i]);
        }

        // Each pool has a probability to get chosen:
        // P( SIMPLE) = 70%
        // P( MEDIUM) = 25%
        // P( TENMUL) =  5%
        // P(COMPLEX) =  1%
        for (let i = 0; i < this.num_elem; i++) {
             
            const random = randInt(0, 99);
            if      (random <  1) this.baseSet[i] = (new Expression(extract_random_element(complex)));
            else if (random <  6) this.baseSet[i] = (new Expression(extract_random_element( tenmul)));
            else if (random < 30) this.baseSet[i] = (new Expression(extract_random_element( medium)));
            else                  this.baseSet[i] = (new Expression(extract_random_element( simple)));
        }
        return this.baseSet;
    }
}

// --- GAME LOGIC CONTAINER ---

export class GameLogic {

    constructor(){
        // We first set up the Base Set Manager
        this.BSM = new BaseSetManager(6);
        this.baseSet = this.BSM.baseSet;
        this.RVS = new ReachableValuesSeacher([...this.baseSet]);

        const possible_targets = [...this.RVS.reachable_values.keys()].filter(value => value >= 100 && value <= 999);
        this.target = extract_random_element(possible_targets);

        this.solutions = this.RVS.reachable_values.get(this.target);
    }

}

// --- DEBUG SOLVER FUNCTION ---

export async function solution_finder() {
    const numbers = [25, 75, 30, 6, 7, 50];
    const target = 192;
    const baseSet = numbers.map(num => new Expression(num));

    const startTime = performance.now();
    const RVS = new ReachableValuesSeacher([...baseSet]);
    const endTime = performance.now();

    console.log(`Time: ${endTime - startTime} ms\n`);

    console.log(numbers);
    console.log("Target:", target);
    console.log();
    const solutions = RVS.reachable_values.get(target);
    if (solutions){
        console.log(`Solutions (${solutions.length} different):`);
        console.log("•", solutions.map(expr => expr.developed_string()).join("\n• "));
    } else {
        for(let i = 1; i <= 100; i++){
            for(let s = -1; s <= 1; s+=2){
                const I = i * s;
                const solution_prox = RVS.reachable_values.get(target + I);
                if(solution_prox){
                    console.log(`NOT POSSIBLE to ${target}. Best possible: ${i} away`);
                    console.log(`Solutions for ${target+I} (${solution_prox.length} different):`);
                    console.log("•", solution_prox.map(expr => expr.developed_string()).join("\n• "));
                    return;
                }
            }
        }
    }
}