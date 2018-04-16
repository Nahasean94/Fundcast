const queries = require('./../databases/queries')

test('it should signup', () => {
    const userInfo = {
        first_name : 'John',
        last_name : 'Doe',
        email : 'doe@exammple.com',
        password : 'pass',
        birthday : new Date(1994, 1, 22).toLocaleDateString()
    }
    expect.assertions(1);
    return queries.signup(userInfo).then(data => {
        expect(typeof data).toBe('object');
    });
})
