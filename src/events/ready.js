export default {
  name: 'ready',
  async execute(client) {
    console.log(`\u2713 Sigil ready — logged in as ${client.user.tag}`);
  }
};
