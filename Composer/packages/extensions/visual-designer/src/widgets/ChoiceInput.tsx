// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import { FC } from 'react';
import { DialogGroup, PromptTab } from '@bfc/shared';

import { ChoiceInputSize, ChoiceInputMarginTop } from '../constants/ElementSizes';
import { NodeEventTypes } from '../constants/NodeEventTypes';
import { NodeColors } from '../constants/ElementColors';
import { measureJsonBoundary } from '../layouters/measureJsonBoundary';
import { ElementIcon } from '../utils/obiPropertyResolver';
import { FormCard } from '../components/nodes/templates/FormCard';
import { NodeProps } from '../components/nodes/nodeProps';
import { getUserAnswersTitle } from '../components/nodes/utils';

export const ChoiceInputChoices = ({ choices }) => {
  if (!Array.isArray(choices)) {
    return null;
  }

  return (
    <div data-testid="ChoiceInput" css={{ padding: '0 0 16px 29px' }}>
      {choices.map(({ value }, index) => {
        if (index < 3) {
          return (
            <div
              key={index}
              role="choice"
              css={{
                height: ChoiceInputSize.height,
                width: ChoiceInputSize.width,
                marginTop: ChoiceInputMarginTop,
                paddingLeft: '7px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                fontFamily: 'Segoe UI',
                fontSize: '12px',
                lineHeight: '19px',
                border: '1px solid #B3B0AD',
                boxSizing: 'border-box',
                borderRadius: '2px',
              }}
              title={typeof value === 'string' ? value : ''}
            >
              {value}
            </div>
          );
        }
      })}
      {Array.isArray(choices) && choices.length > 3 ? (
        <div
          data-testid="hasMore"
          css={{
            height: ChoiceInputSize.height,
            width: ChoiceInputSize.width,
            marginTop: ChoiceInputMarginTop,
            textAlign: 'center',
            fontFamily: 'Segoe UI',
            fontSize: '12px',
            lineHeight: '14px',
            boxSizing: 'border-box',
          }}
        >
          {`${choices.length - 3} more`}
        </div>
      ) : null}
    </div>
  );
};

export const ChoiceInput: FC<NodeProps> = ({ id, data, onEvent }): JSX.Element => {
  const boundary = measureJsonBoundary(data);
  const { choices } = data;
  const children = <ChoiceInputChoices choices={choices} />;

  return (
    <FormCard
      nodeColors={NodeColors[DialogGroup.INPUT]}
      header={getUserAnswersTitle(data._type)}
      icon={ElementIcon.User}
      label={data.property || '<property>'}
      onClick={() => {
        onEvent(NodeEventTypes.Focus, { id, tab: PromptTab.USER_INPUT });
      }}
      styles={{ width: boundary.width, height: boundary.height }}
    >
      {children}
    </FormCard>
  );
};
