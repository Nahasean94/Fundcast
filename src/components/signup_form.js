"use strict"
import React from 'react'
import {FormGroup, ControlLabel, FormControl, Button} from 'react-bootstrap'

export default () => {
    let first_name, last_name, email, password, confirm_password, birthday
    const handleSubmit =e=> {
         e.preventDefault()
        console.log(first_name.value,last_name.value,email.value,password.value,confirm_password.value,birthday.value)
    }
    return (
        <form onSubmit={handleSubmit}>
            <FormGroup>
                <ControlLabel>First name</ControlLabel>
                <FormControl type="text"
                             autoFocus="true"
                             inputRef={node => {
                    first_name = node
                }}
                />
                <ControlLabel>Last name</ControlLabel>
                <FormControl type="text"
                             inputRef={node => {
                    last_name = node
                }}
                />
                <ControlLabel>Email</ControlLabel>
                <FormControl type="email"
                             inputRef={node => {
                    email = node
                }}
                />
                <ControlLabel>Password</ControlLabel>
                <FormControl type="password"
                             inputRef={node => {
                    password = node
                }}
                />
                <ControlLabel>Confirm password</ControlLabel>
                <FormControl type="password"
                             inputRef={node => {
                    confirm_password = node
                }}
                />
                <ControlLabel>Date of birth</ControlLabel>
                <FormControl type="date"
                             inputRef={node => {
                                 birthday = node
                             }}
                />
            </FormGroup>
            <FormGroup>
                <Button bsStyle="primary"
                        bsSize="small"
                        type="submit"
                        onClick={handleSubmit}>
                    Signup
                </Button>
            </FormGroup>

        </form>
    )
}