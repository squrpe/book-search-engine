const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      // Checking if the user exists
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password');
        return userData;
      }
      throw new AuthenticationError('You are not logged in!');
    }
  },

  Mutation: {
    login: async (parent, { email, password }) => {
       // Login a user, sign a token, and send it back (to client/src/components/LoginForm.js)

      const user = await User.findOne({ email });
      // Checking if the user exists with specific email
      if (!user) {
        throw new AuthenticationError('No User Found with this email!');
      }

      const correctPw = await user.isCorrectPassword(password);
      // Checking if the password is correct
      if (!correctPw) {
        throw new AuthenticationError('Password does not match the previous credentials!');
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, args) => {
      // Create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { newBook }, context) => {
      // Checking if user is logged in
      if (context.user) {
        // Adds book to 'savedBooks'
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: { newBook } }},
          { new: true, runValidators: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You are not logged in!');
    },
    removeBook: async (parent, { bookId }, context) => {
      // Checking if user is logged in
      if (context.user) {
        // Removes book to 'savedBooks'
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } }},
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You are not logged in!');
    },
  },
};

module.exports = resolvers;
