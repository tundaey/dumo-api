const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index')

chai.use(chaiHttp);

describe('GET api/auth/pay/create', function() {
  it('should create a new transaction', function(done) {
    chai.request(server)
    .post('/api/auth/pay/create')
    .send({
      customer_id: '123', 
      amount: 200, 
      user_id: '123', 
      trainer_id: '333', 
      appointment_id: '111', 
      time: '8:30'
    })
  })
})