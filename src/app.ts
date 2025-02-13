import 'dotenv/config';
import express from 'express';
import {
	InteractionResponseFlags,
	InteractionResponseType,
	InteractionType,
	verifyKeyMiddleware,
} from 'discord-interactions';
import { isURL } from 'class-validator';
import { deferResponse } from './utils';

export const {
	APP_ID,
	PUBLIC_KEY,
	DISCORD_TOKEN,
	NODE_ENV,
	SOCIAL_MEDIA_SCREENSHOT_API_URI,
	SOCIAL_MEDIA_SCREENSHOT_API_URI_DEV,
} = process.env;
export const API_URI =
	NODE_ENV === 'production'
		? SOCIAL_MEDIA_SCREENSHOT_API_URI
		: SOCIAL_MEDIA_SCREENSHOT_API_URI_DEV;

if (!APP_ID || !PUBLIC_KEY || !DISCORD_TOKEN || !API_URI) {
	throw new Error('Define ENVS');
}

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
	'/interactions',
	verifyKeyMiddleware(PUBLIC_KEY),
	async function (req, res) {
		// Interaction id, type and data
		const { type, data, token, member } = req.body;

		/**
		 * Handle verification requests
		 */
		if (type === InteractionType.PING) {
			res.send({ type: InteractionResponseType.PONG });
			return;
		}

		/**
		 * Handle slash command requests
		 * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
		 */
		if (type === InteractionType.APPLICATION_COMMAND) {
			const { name, options } = data;

			// Take screenshot command
			if (name === 'smss') {
				// Send a message into the channel where command was triggered from
				const url = options[0];
				const commentsDepth = options[1];
				if (!url) {
					res.status(400).json({ error: 'url is required' });
					return;
				}
				if (
					!isURL(url.value, {
						protocols: ['http', 'https'],
						require_protocol: true,
					})
				) {
					res.status(400).json({ error: 'url is not valid' });
					return;
				}
				deferResponse(token, member.user.id, url.value, commentsDepth?.value);
				res.send({
					type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						flags: InteractionResponseFlags.EPHEMERAL,
					},
				});
				return;
			}

			console.error(`unknown command: ${name}`);
			res.status(400).json({ error: 'unknown command' });
			return;
		}

		console.error('unknown interaction type', type);
		res.status(400).json({ error: 'unknown interaction type' });
		return;
	}
);

app.listen(PORT, () => {
	console.log('Listening on port', PORT);
});
