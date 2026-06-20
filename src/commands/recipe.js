const {
    SlashCommandBuilder, EmbedBuilder,
} = require('discord.js');
const { getConfig, fetchFromCulinaryOS } = require('./menu.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Look up a recipe from CulinaryOS')
        .addSubcommand(sub =>
            sub.setName('search')
                .setDescription('Search for a recipe by name or ingredient')
                .addStringOption(opt => opt.setName('query').setDescription('Recipe name or ingredient').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('get')
                .setDescription('View full details for a recipe')
                .addStringOption(opt => opt.setName('name').setDescription('Exact recipe name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('random')
                .setDescription('Get a random recipe from CulinaryOS')
        ),

    async execute(interaction) {
        const sub    = interaction.options.getSubcommand();
        const gId    = interaction.guild.id;
        const config = getConfig.get(gId);

        if (!config)
            return interaction.reply({ content: '❌ CulinaryOS is not configured. Ask an admin to run `/menu setup` first.', ephemeral: true });

        await interaction.deferReply();

        try {
            if (sub === 'search') {
                const query   = interaction.options.getString('query');
                const data    = await fetchFromCulinaryOS(config, `/api/recipes/search?q=${encodeURIComponent(query)}`);
                const results = Array.isArray(data) ? data : (data.results ?? data.recipes ?? []);

                if (!results.length)
                    return interaction.editReply({ content: `❌ No recipes found for **${query}**.` });

                const lines = results.slice(0, 10).map((r, i) =>
                    `**${i + 1}.** ${r.name}${r.prepTime ? ` — ⏱️ ${r.prepTime}` : ''}${r.servings ? ` | 👥 ${r.servings} servings` : ''}`
                );

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`🔍 Recipes matching "${query}"`)
                        .setDescription(lines.join('\n'))
                        .setColor('#F4A642')
                        .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name} • Use /recipe get to see full details` })
                        .setTimestamp()],
                });
            }

            if (sub === 'get' || sub === 'random') {
                let recipe;
                if (sub === 'random') {
                    const data = await fetchFromCulinaryOS(config, '/api/recipes/random');
                    recipe = Array.isArray(data) ? data[0] : (data.recipe ?? data);
                } else {
                    const name = interaction.options.getString('name');
                    const data = await fetchFromCulinaryOS(config, `/api/recipes/search?q=${encodeURIComponent(name)}&exact=true`);
                    const results = Array.isArray(data) ? data : (data.results ?? data.recipes ?? []);
                    recipe = results[0];
                }

                if (!recipe)
                    return interaction.editReply({ content: '❌ Recipe not found.' });

                const embed = new EmbedBuilder()
                    .setTitle(`📖 ${recipe.name}`)
                    .setColor('#F4A642')
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                if (recipe.description) embed.setDescription(recipe.description);

                const meta = [];
                if (recipe.prepTime)  meta.push(`⏱️ Prep: ${recipe.prepTime}`);
                if (recipe.cookTime)  meta.push(`🔥 Cook: ${recipe.cookTime}`);
                if (recipe.servings)  meta.push(`👥 Serves: ${recipe.servings}`);
                if (recipe.calories)  meta.push(`🔢 Calories: ${recipe.calories}`);
                if (recipe.cost)      meta.push(`💰 Cost: $${parseFloat(recipe.cost).toFixed(2)}`);
                if (meta.length)      embed.addFields({ name: 'Details', value: meta.join('  •  '), inline: false });

                if (recipe.ingredients?.length) {
                    const ingLines = recipe.ingredients.map(i =>
                        typeof i === 'string' ? `• ${i}` : `• ${i.quantity ?? ''} ${i.unit ?? ''} ${i.name ?? i}`.trim()
                    ).join('\n');
                    embed.addFields({ name: '🥬 Ingredients', value: ingLines.slice(0, 1024), inline: false });
                }

                if (recipe.steps?.length || recipe.instructions) {
                    const steps = recipe.steps ?? recipe.instructions;
                    const stepLines = Array.isArray(steps)
                        ? steps.map((s, i) => `**${i + 1}.** ${typeof s === 'string' ? s : s.instruction ?? s.step}`).join('\n')
                        : steps;
                    embed.addFields({ name: '👨‍🍳 Instructions', value: stepLines.slice(0, 1024), inline: false });
                }

                if (recipe.allergens?.length)
                    embed.addFields({ name: '⚠️ Allergens', value: recipe.allergens.join(', '), inline: true });
                if (recipe.tags?.length)
                    embed.addFields({ name: '🏷️ Tags', value: recipe.tags.join(', '), inline: true });

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (err) {
            console.error('[Recipe] CulinaryOS error:', err.message);
            return interaction.editReply({ content: `❌ Could not reach CulinaryOS: \`${err.message}\`` });
        }
    },
};
