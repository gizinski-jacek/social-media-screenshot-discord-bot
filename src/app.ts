import 'dotenv/config';
import express from 'express';
import {
	InteractionResponseFlags,
	InteractionResponseType,
	InteractionType,
	verifyKeyMiddleware,
} from 'discord-interactions';
import { isURL } from 'class-validator';
import {
	deferDeleteMostRecentScreenshotRes,
	deferDeleteSpecificScreenshotRes,
	deferGetScreenshotsFromToDateRes,
	deferMostRecentScreenshotRes,
	deferScreenshotItRes,
} from './utils';

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
		const { type, data, token, context, member, user } = req.body;

		/**
		 * Handle slash command requests
		 * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
		 */
		if (type === InteractionType.APPLICATION_COMMAND) {
			const { name, options } = data as {
				name: string;
				options: { name: string; number: string; value: any }[];
			};
			const userData = context === 0 ? member.user : user;
			if (!userData) {
				res.status(400).json({ error: 'Error getting discord user info.' });
				return;
			}
			// Context dependant response. Accepted contexts by command are 0 and 1.
			// Context 0 indicates user triggered event from discord server channel,
			// Response to channel will be ephemeral (visible only to user).
			// Defered message will be patched into this response and also sent to user's DM's.
			// Context 1 indicates event triggered from DM's with bot, therefore no need
			// for ephemeral flag. Defered message will be patched into this response.
			const response =
				context === 0
					? {
							type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
							data: {
								flags: InteractionResponseFlags.EPHEMERAL,
							},
					  }
					: {
							type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
					  };
			// Take screenshot command
			if (name === 'ssit') {
				// Send a message into the channel where command was triggered from
				const url = options.find((o) => o.name === 'url')?.value;
				const commentsDepth = options.find((o) => o.name === 'cd')?.value;
				const nitter = options.find((o) => o.name === 'nitter')?.value;
				if (!url) {
					res.status(400).json({ error: 'URL is required.' });
					return;
				}
				if (
					!isURL(url, {
						protocols: ['http', 'https'],
						require_protocol: true,
					})
				) {
					res.status(400).json({ error: 'Invalid URL.' });
					return;
				}
				deferScreenshotItRes(
					token,
					userData,
					context,
					url,
					commentsDepth,
					nitter
				);
				res.send(response);
				return;
			}

			// Resend most recent screenshot taken for user
			if (name === 'ssrecent') {
				const social = options?.find((o) => o.name === 'social')?.value;
				deferMostRecentScreenshotRes(token, userData, context, social);
				res.send(response);
				return;
			}

			// Delete most recent screenshot taken for user
			if (name === 'ssdeleterecent') {
				const social = options?.find((o) => o.name === 'social')?.value;
				deferDeleteMostRecentScreenshotRes(token, userData, context, social);
				res.send(response);
				return;
			}

			// Delete specific screenshot taken for user
			if (name === 'ssdeleteid') {
				const id = options?.find((o) => o.name === 'id')?.value;
				if (!id) {
					res.status(400).json({ error: 'Id (filename) is required.' });
					return;
				}
				deferDeleteSpecificScreenshotRes(token, userData, context, id);
				res.send(response);
				return;
			}

			// Get screenshots in a date range
			if (name === 'ssfromtodate') {
				const fromDate = options?.find((o) => o.name === 'from-date')?.value;
				const toDate = options?.find((o) => o.name === 'to-date')?.value;
				const social = options?.find((o) => o.name === 'social')?.value;
				const newFromDate = new Date(fromDate).getTime();
				const newToDate = new Date(toDate).getTime();
				if (
					(Object.prototype.toString.call(newFromDate) !== '[object Date]' &&
						isNaN(newFromDate)) ||
					(Object.prototype.toString.call(newToDate) !== '[object Date]' &&
						isNaN(newToDate))
				) {
					res.status(400).json({ error: 'Invalid dates format.' });
					return;
				}
				if (newFromDate > newToDate) {
					res.status(400).json({
						error: 'From date can not be newer than To date.',
					});
					return;
				}
				deferGetScreenshotsFromToDateRes(
					token,
					userData,
					context,
					newFromDate,
					newToDate,
					social
				);
				res.send(response);
				return;
			}

			console.error(`unknown command: ${name}`);
			res.status(400).json({ error: 'Unknown command' });
			return;
		}

		console.error('unknown interaction type', type);
		res.status(400).json({ error: 'Unknown interaction type' });
		return;
	}
);

app.listen(PORT, () => {
	console.log('Listening on port', PORT);
});
