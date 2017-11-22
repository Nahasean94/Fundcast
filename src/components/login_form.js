"use strict"
import React from 'react'
import {FormGroup, ControlLabel, FormControl, Button} from 'react-bootstrap'
import axios from 'axios'

export default ({store}) => {
    let email, password
    const handleSubmit = e => {
         e.preventDefault()
        if (email.value && password.value) {
            axios.post("/login",{email:email.value,password:password.value}).then(function (person) {
                store.dispatch({type:"PROFILE",payload:person})
            }).catch(function (err) {
                console.log(err)
            })
            email.value = ''
            password.value = ''
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <FormGroup>
                <ControlLabel>Email</ControlLabel>
                <FormControl
                    type="email"
                    autoFocus="true"
                    placeholder="Enter email" inputRef={node => {
                    email = node
                }}
                />
                <ControlLabel>Password</ControlLabel>
                <FormControl
                    type="password"
                    placeholder="Enter password" inputRef={node => {
                    password = node
                }}
                />

            </FormGroup>
            <FormGroup>
                <Button bsStyle="primary"
                        bsSize="small"
                        type="submit"
                        onClick={handleSubmit}>
                    login
                </Button>
            </FormGroup>

        </form>

    )
}