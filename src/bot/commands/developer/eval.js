module.exports.load = client => {
    client.commands['eval'] = {
        conf : {
            'name' : 'Eval',
            'type' : 0,
            'description' : 'Lets developers evaluate code.',
            'usage' : `${client.settings.prefix}eval {code}`
        },

        run(message) {
            if(!client.settings.developers.includes(message.author.id)) return client.send_error(message, 'You are not a developer.')
            const clean = text => {
                if (typeof(text) === "string")
                    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                else
                    return text;
                }
            try {
                const code = message.content.split(' ').splice(1).join(" ")
                let evaled = eval(code)
                if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled)
                message.channel.send(clean(evaled), {code:"xl"})
            } catch (err) {
                message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``)
            }
        }
    }
}