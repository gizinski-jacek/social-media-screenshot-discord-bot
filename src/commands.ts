import 'dotenv/config';
import { InstallGlobalCommands } from './utils';

const SCREENSHOT_IT_COMMAND = {
	name: 'ssit',
	description: 'Take screenshot of social media post',
	options: [
		{
			type: 3,
			name: 'url',
			description: 'Post link to screenshot',
			required: true,
		},
		{
			type: 4,
			name: 'cd',
			description:
				'How many comments to include? (not supported by FB videos, IG and Twitter)',
			required: false,
			min_value: 0,
			max_value: 10,
		},
		{
			type: 5,
			name: 'nitter',
			description: 'Use Nitter as Twitter alternative to include comments?',
			required: false,
		},
	],
	type: 1,
	integration_types: [0],
	contexts: [0, 1],
};

const SCREENSHOT_LAST_COMMAND = {
	name: 'sslast',
	description: 'Resend last screenshot taken',
	options: [
		{
			type: 3,
			name: 'social',
			description: 'From specific social media?',
			choices: [
				{
					name: 'Bluesky',
					value: 'bsky',
				},
				{
					name: 'X/Twitter',
					value: 'twitter',
				},
				{
					name: 'Facebook',
					value: 'facebook',
				},
				{
					name: 'Instagram',
					value: 'instagram',
				},
			],
		},
	],
	type: 1,
	integration_types: [0],
	contexts: [0, 1],
};

const ALL_COMMANDS = [SCREENSHOT_IT_COMMAND, SCREENSHOT_LAST_COMMAND];

InstallGlobalCommands(ALL_COMMANDS);
