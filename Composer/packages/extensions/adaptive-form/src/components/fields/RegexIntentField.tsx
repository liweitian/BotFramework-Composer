// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React, { useState } from 'react';
import { FieldProps, useShellApi } from '@bfc/extension';
import { DialogInfo, RegexRecognizer } from '@bfc/shared';
import debounce from 'lodash/debounce';

import { StringField } from './StringField';

function getRegexIntentPattern(currentDialog: DialogInfo, intent: string): string {
  const recognizer = currentDialog.content.recognizer as RegexRecognizer;
  let pattern = '';

  if (!recognizer) {
    return '';
  }

  if (recognizer.intents) {
    pattern = recognizer.intents.find(i => i.intent === intent)?.pattern || '';
  }

  return pattern;
}

const RegexIntentField: React.FC<FieldProps> = ({ value: intentName, ...rest }) => {
  const { currentDialog, shellApi } = useShellApi();
  const [localValue, setLocalValue] = useState(getRegexIntentPattern(currentDialog, intentName));
  const handleIntentchange = (pattern): void => {
    setLocalValue(pattern);
    debounce(() => shellApi.updateRegExIntent(currentDialog.id, intentName, pattern), 300)();
  };

  return <StringField {...rest} label={false} value={localValue} onChange={handleIntentchange} />;
};

export { RegexIntentField };
