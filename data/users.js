import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'admin',
    phone: '123-456-7890',
    addresses: [
      {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'USA',
        isDefault: true,
      },
    ],
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'customer',
    phone: '123-456-7891',
    addresses: [
      {
        street: '123 John St',
        city: 'John City',
        state: 'JS',
        zipCode: '12346',
        country: 'USA',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'customer',
    phone: '123-456-7892',
    addresses: [
      {
        street: '123 Jane St',
        city: 'Jane City',
        state: 'JS',
        zipCode: '12347',
        country: 'USA',
        isDefault: true,
      },
    ],
  },
];

export default users;