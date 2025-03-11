import 'dotenv/config';
import { InstallGlobalCommands } from './utils';

const SCREENSHOT_COMMAND = {
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
			description:
				'Use nitter as alternative to include comments? (for Twitter links only)',
			required: false,
		},
	],
	type: 1,
	integration_types: [0, 1],
	contexts: [0, 2],
};

const ALL_COMMANDS = [SCREENSHOT_COMMAND];

InstallGlobalCommands(ALL_COMMANDS);
