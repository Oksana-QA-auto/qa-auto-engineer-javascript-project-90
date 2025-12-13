export const usersFx = {
  create: {
    email: 'alice.smith@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
  },

  editEmail: {
    email: 'bob.brown@example.com',
    firstName: 'Bob',
    lastName: 'Brown',
    invalidEmail: 'not-an-email',
    fixedEmail: 'bob.brown.fixed@example.com',
  },

  deleteOne: {
    email: 'carl.stone@example.com',
    firstName: 'Carl',
    lastName: 'Stone',
  },

  bulk: {
    user1: { email: 'bulk1@example.com', firstName: 'Bulk1', lastName: 'Temp' },
    user2: { email: 'bulk2@example.com', firstName: 'Bulk2', lastName: 'Temp' },
  },
}
