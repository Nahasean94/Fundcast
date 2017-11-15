import React from 'react'
import { render } from 'react-dom'
import Menu from './components/Menu'

alert('bundle loaded, Rendering in browser')
render(
    <Menu recipes={__DATA__} />,
    document.getElementById("react-container")
)
alert('render complete')