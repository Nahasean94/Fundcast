
import React from 'react'

import Ingredient from './ingredients'
const IngredientsList = ({ list }) =>
    <ul className="ingredients">
        {list.map((ingredient, i) =>
            <Ingredient key={i} {...ingredient} />
        )}
    </ul>
export default IngredientsList