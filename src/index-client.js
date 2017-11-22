import React from 'react'
import ReactDOM from 'react-dom'
import {applyMiddleware,createStore} from 'redux'
import {Col} from 'react-bootstrap'
import LoginForm from './components/login_form'
import SignupForm from './components/signup_form'
import thunk from 'redux-thunk'

const profile = (state = {}, action) => {
    switch (action.type) {
        case "PROFILE":
            console.log(action.payload)
            return state = action.payload
    }

}
const middleware = applyMiddleware(thunk)
const store = createStore(profile, middleware)
const Info = () => {
    if (store.getState() !== undefined) {
        return (
            <div>
                <p>{store.getState().first_name}</p>
                <p>{store.getState().last_name}</p>
                <p>{store.getState().email}</p>
                <p>{store.getState().birthday}</p>
            </div>
        )

    }
    else {
        return null
    }
}


const Twinpal = () => (
    <div className="container">
        <div className="row">
            <Info/>
            <Col sm={6}>
                <Col sm={9}>
                    <h4>Login</h4>
                    <LoginForm store={store}/>
                </Col>
            </Col>
            <Col sm={4}>
                <h4>Signup</h4>
                <SignupForm/>
            </Col>
        </div>
    </div>
)


const render = () => (
    ReactDOM.render(
        <Twinpal/>, document.getElementById('root')
    )
)
render()
store.subscribe(render)
