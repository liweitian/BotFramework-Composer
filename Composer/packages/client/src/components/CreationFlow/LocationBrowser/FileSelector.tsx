// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import path from 'path';

import { jsx } from '@emotion/core';
import { useMemo, useState } from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  CheckboxVisibility,
} from 'office-ui-fabric-react/lib/DetailsList';
import formatMessage from 'format-message';
import { Fragment } from 'react';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Stack, StackItem } from 'office-ui-fabric-react/lib/Stack';
import moment from 'moment';

import { FileTypes } from '../../../constants/index';
import { StorageFolder, File } from '../../../store/types';
import { getFileIconName, calculateTimeDiff } from '../../../utils';
import { nameRegex } from '../../../constants';

import {
  dropdown,
  detailListContainer,
  detailListClass,
  tableCell,
  content,
  halfstack,
  stackinput,
  editButton,
  nameField,
} from './styles';

interface FileSelectorProps {
  operationMode: {
    read: boolean;
    write: boolean;
  };
  focusedStorageFolder: StorageFolder;
  isWindows: boolean;
  createFolder: (path: string) => void;
  updateFolder: (path: string, oldName: string, newName: string) => void;
  onCurrentPathUpdate: (newPath?: string, storageId?: string) => void;
  onFileChosen: (file: any) => void;
  checkShowItem: (file: File) => boolean;
}

type SortState = {
  key: string;
  descending: boolean;
};

enum EditMode {
  NONE,
  Creating,
  Updating,
}

const _renderIcon = (file: File) => {
  const iconName = getFileIconName(file);
  if (iconName === FileTypes.FOLDER) {
    return <Icon iconName="OpenFolderHorizontal" style={{ fontSize: '16px' }} />;
  } else if (iconName === FileTypes.BOT) {
    return <Icon iconName="Robot" style={{ fontSize: '16px' }} />;
  } else if (iconName === FileTypes.UNKNOWN) {
    return <Icon iconName="Page" style={{ fontSize: '16px' }} />;
  }
  // fallback for other possible file types
  const url = `https://static2.sharepointonline.com/files/fabric/assets/brand-icons/document/svg/${iconName}_16x1.svg`;
  return <img alt={`${iconName} file icon`} className={detailListClass.fileIconImg} src={url} />;
};

export const FileSelector: React.FC<FileSelectorProps> = (props) => {
  const {
    onFileChosen,
    focusedStorageFolder,
    checkShowItem,
    createFolder,
    updateFolder,
    onCurrentPathUpdate,
    operationMode,
    isWindows = false,
  } = props;
  // for detail file list in open panel
  const currentPath = path.join(focusedStorageFolder.parent, focusedStorageFolder.name);
  const [indexToUpdate, setIndexToUpdate] = useState(-1);
  const [folderName, setFolderName] = useState('');
  const [editMode, setEditMode] = useState(EditMode.NONE);
  const createOrUpdateFolder = (index: number) => {
    if (editMode === EditMode.Creating && nameRegex.test(folderName)) {
      createFolder(path.join(currentPath, folderName));
    }
    if (editMode === EditMode.Updating && nameRegex.test(folderName)) {
      updateFolder(currentPath, storageFiles[index].name, folderName);
    }
    if (nameRegex.test(folderName)) {
      setFolderName('');
      setIndexToUpdate(-1);
      setEditMode(EditMode.NONE);
      storageFiles[index].name = folderName;
    }
    setFolderName('');
  };

  const onEditButtonClick = (file: File, index: number) => {
    setEditMode(EditMode.Updating);
    setFolderName(file.name);
    setIndexToUpdate(index);
  };

  const _renderNameColumn = (file: File, index: number | undefined) => {
    const iconName = getFileIconName(file);
    return (
      <div
        data-is-focusable
        css={tableCell}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && index) {
            createOrUpdateFolder(index);
            e.preventDefault();
          }
        }}
      >
        {index == indexToUpdate ? (
          <TextField
            autoFocus
            styles={nameField}
            value={folderName}
            onBlur={() => createOrUpdateFolder(index)}
            onChange={(e, value) => {
              e.preventDefault();
              if (value !== undefined) {
                setFolderName(value);
              }
            }}
          />
        ) : (
          <Link
            aria-label={
              file.name === '..'
                ? formatMessage('previous folder')
                : formatMessage('{icon} name is {file}', {
                    icon: iconName,
                    file: file.name,
                  })
            }
            styles={{ root: { marginTop: 3, marginLeft: 10 } }}
            onClick={() => onFileChosen(file)}
          >
            {file.name}
          </Link>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      key: 'type',
      name: formatMessage('File Type'),
      className: detailListClass.fileIconCell,
      iconClassName: detailListClass.fileIconHeaderIcon,
      ariaLabel: formatMessage('Click to sort by file type'),
      iconName: 'Page',
      isIconOnly: true,
      fieldName: 'name',
      minWidth: 16,
      maxWidth: 16,
      onRender: _renderIcon,
    },
    {
      key: 'name',
      name: formatMessage('Name'),
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isRowHeader: true,
      isResizable: true,
      sortAscendingAriaLabel: formatMessage('Sorted A to Z'),
      sortDescendingAriaLabel: formatMessage('Sorted Z to A'),
      data: 'string',
      onRender: _renderNameColumn,
      isPadded: true,
    },
    {
      key: 'lastModified',
      name: formatMessage('Date Modified'),
      fieldName: 'dateModifiedValue',
      minWidth: 60,
      maxWidth: 170,
      isResizable: true,
      data: 'number',
      onRender: (item: File) => {
        return (
          <div data-is-focusable css={tableCell}>
            <div
              aria-label={formatMessage(`Last modified time is {time}`, {
                time: calculateTimeDiff(item.lastModified),
              })}
              css={content}
              tabIndex={-1}
            >
              {calculateTimeDiff(item.lastModified)}
            </div>
          </div>
        );
      },
      isPadded: true,
    },
    {
      key: 'Edit',
      name: '',
      fieldName: '',
      minWidth: 30,
      maxWidth: 30,
      isResizable: false,
      data: 'icon',
      onRender: (item: File, index: number | undefined) => {
        return index == 0 || !operationMode.write || !focusedStorageFolder.writable ? null : (
          <div data-is-focusable css={tableCell}>
            <div css={content} tabIndex={-1}>
              <IconButton
                ariaLabel="Edit"
                iconProps={{ iconName: 'Edit' }}
                styles={editButton}
                title="Edit"
                onClick={(e) => {
                  e.preventDefault();
                  if (index) {
                    onEditButtonClick(item, index);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
            </div>
          </div>
        );
      },
      isPadded: true,
    },
  ];

  const [currentSort, setSort] = useState<SortState>({ key: tableColumns[0].key, descending: true });

  const diskRootPattern = /[a-zA-Z]:\/$/;
  const storageFiles = useMemo(() => {
    if (!focusedStorageFolder.children) return [];
    const files = focusedStorageFolder.children.reduce((result, file) => {
      const check = typeof checkShowItem === 'function' ? checkShowItem : () => true;
      if (check(file)) {
        if (isWindows) {
          const newName = file.name.replace(/\//g, '\\');
          const newfile: File = { ...file, name: newName };
          result.push(newfile);
        } else {
          result.push(file);
        }
      }
      result.sort((f1, f2) => {
        // NOTE: bringing in Moment for this is not very efficient, but will
        // work for now until we can read file modification dates in as
        // numeric timestamps instead of preformatted strings
        const { key } = currentSort;
        const v1 = key === 'lastModified' ? moment(f1[key]) : f1[key];
        const v2 = key === 'lastModified' ? moment(f2[key]) : f2[key];
        if (v1 < v2) return currentSort.descending ? 1 : -1;
        if (v1 > v2) return currentSort.descending ? -1 : 1;
        return 0;
      });
      return result;
    }, [] as File[]);
    // add parent folder
    files.unshift({
      name: '..',
      type: 'folder',
      path: diskRootPattern.test(currentPath) || currentPath === '/' ? '/' : focusedStorageFolder.parent,
    });
    return files;
  }, [focusedStorageFolder, currentSort.key, currentSort.descending]);

  function onRenderDetailsHeader(props, defaultRender) {
    return (
      <Sticky isScrollSynced stickyPosition={StickyPositionType.Header}>
        {defaultRender({
          ...props,
          onRenderColumnHeaderTooltip: (tooltipHostProps) => <TooltipHost {...tooltipHostProps} />,
        })}
      </Sticky>
    );
  }

  function getNavItemPath(array, separator, start, end) {
    if (end === 0) return array[0];
    if (!start) start = 0;
    if (!end) end = array.length - 1;
    end++;
    return array.slice(start, end).join(separator);
  }

  function onCreateNewFolder() {
    setIndexToUpdate(1);
    const newFolder: File = {
      name: '',
      type: FileTypes.FOLDER,
      path: currentPath,
    };
    setFolderName('');
    storageFiles.splice(1, 0, newFolder);
    setEditMode(EditMode.Creating);
  }

  const separator = path.sep;
  const pathItems = currentPath.split(separator).filter((p) => p !== '');
  const breadcrumbItems = pathItems.map((item, index) => {
    let itemPath = getNavItemPath(pathItems, separator, 0, index);
    // put a leading / back on the path if it started as a unix style path
    itemPath = currentPath.startsWith('/') ? `/${itemPath}` : itemPath;
    // add a trailing / if the last path is something like c:
    itemPath = itemPath[itemPath.length - 1] === ':' ? `${itemPath}/` : itemPath;
    const displayText = isWindows ? itemPath.replace(/\//g, '\\') : itemPath;
    return {
      text: displayText, // displayed text
      key: itemPath, // value returned
      title: item, // title shown on hover
    };
  });
  if (currentPath) {
    breadcrumbItems.splice(0, 0, {
      text: '/', // displayed text
      key: '/', // value returned
      title: '/', // title shown on hover
    });
  }
  breadcrumbItems.reverse();
  const updateLocation = (e, item?: IDropdownOption) => {
    onCurrentPathUpdate(item ? (item.key as string) : '');
  };
  return (
    <Fragment>
      <Stack horizontal styles={stackinput} tokens={{ childrenGap: '2rem' }}>
        <StackItem grow={0} styles={halfstack}>
          <Dropdown
            data-testid={'FileSelectorDropDown'}
            errorMessage={
              operationMode.write && !focusedStorageFolder.writable
                ? formatMessage('You do not have permission to save bots here')
                : ''
            }
            label={formatMessage('Location')}
            options={breadcrumbItems}
            selectedKey={currentPath}
            styles={dropdown}
            onChange={updateLocation}
          />
        </StackItem>
        <StackItem>
          <div onClick={onCreateNewFolder}>{formatMessage('create new folder')} </div>
        </StackItem>
      </Stack>
      <div css={detailListContainer} data-is-scrollable="true">
        <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
          <DetailsList
            isHeaderVisible
            checkboxVisibility={CheckboxVisibility.hidden}
            columns={tableColumns.map((col) => ({
              ...col,
              isSorted: col.key === currentSort.key,
              isSortedDescending: currentSort.descending,
            }))}
            compact={false}
            getKey={(item) => item.name}
            items={storageFiles}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.single}
            onColumnHeaderClick={(_, clickedColumn) => {
              if (clickedColumn == null) return;
              if (clickedColumn.key === currentSort.key) {
                clickedColumn.isSortedDescending = !currentSort.descending;
                setSort({ key: currentSort.key, descending: !currentSort.descending });
              } else {
                clickedColumn.isSorted = true;
                clickedColumn.isSortedDescending = false;
                setSort({ key: clickedColumn.key, descending: false });
              }
            }}
            onItemInvoked={onFileChosen}
            onRenderDetailsHeader={onRenderDetailsHeader}
          />
        </ScrollablePane>
      </div>
    </Fragment>
  );
};
