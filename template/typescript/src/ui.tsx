import React from 'react';
import {Text, Color} from 'ink';

interface Props {
	name?: string;
}

export const App: React.FC<Props> = ({name}: Props): React.ReactElement => (
	<Text>
		Hello, <Color green>{name}</Color>
	</Text>
);

App.defaultProps = {
	name: 'Stranger'
};
