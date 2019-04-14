module.exports.load = client => {
    client.commands['eval'] = {
        settings : {
            type : 'developer'
        },

        async run(message) {
            if(!client.settings.developers.includes(message.author.id)) return
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