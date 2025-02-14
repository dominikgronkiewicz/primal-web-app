import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import { useAccountContext } from '../../contexts/AccountContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { hookForDev } from '../../lib/devTools';
import { PrimalFeed } from '../../types/primal';

import styles from './FeedSorter.module.scss';


const FeedSorter: Component<{ id?: string }> = (props) => {

  let sorter: any;

  const settings = useSettingsContext();
  const account = useAccountContext();

  const [editMode, setEditMode] = createSignal('');

  const [newName, setNewName] = createSignal('');

  const availableFeeds = () => {
    return settings?.availableFeeds || [];
  };

  const removeFeed = (feed: PrimalFeed) => {
    settings?.actions.removeAvailableFeed(feed);
  };

  const editFeed = (feed: PrimalFeed) => {
    setEditMode(() => feed.hex || '');
    setNewName(() => feed.name);
    const input = document.getElementById(`input_${feed.hex}`);
    input && input.focus();
  };

  const updateFeedName = (feed: PrimalFeed) => {
    settings?.actions.renameAvailableFeed(feed, newName());
    setEditMode('');
  }

  const sortList = (target: any) => {
    // Get all items
    let items = target.getElementsByClassName(styles.feedItem);
    // init current item
    let current: any = null;

    // (Make items draggable and sortable
    for (let i of items) {
      i.draggable = true;

      i.ondragstart = (e: DragEvent) => {
        current = i;
        for (let it of items) {
          if (it === current) {
            it.classList.add(styles.draggedItem);
          }
        }
      };

      i.ondragenter = (e: DragEvent) => {
        const oldIndex = current.getAttribute('data-index');
        const newIndex = i.getAttribute('data-index');

        if (oldIndex > newIndex) {
          i.classList.add(styles.draggedBefore);
          i.classList.remove(styles.draggedAfter);
        }
        if (oldIndex < newIndex) {
          i.classList.add(styles.draggedAfter);
          i.classList.remove(styles.draggedBefore);
        }
      };

      i.ondragleave = () => {
        i.classList.remove(styles.draggedBefore);
        i.classList.remove(styles.draggedAfter);
      }

      i.ondragend = () => { for (let it of items) {
          it.classList.remove(styles.draggedItem);
          i.classList.remove(styles.draggedBefore);
          i.classList.remove(styles.draggedAfter);
      }};

      // Prevent default "drop", so we can do our own
      i.ondragover = (e: DragEvent) => e.preventDefault();

      i.ondrop = (e: DragEvent) => {
        e.preventDefault();
        if (i != current) {
          const oldIndex = current.getAttribute('data-index');
          const newIndex = i.getAttribute('data-index');

          settings?.actions.moveAvailableFeed(oldIndex, newIndex);

          for (let it of items) {
            it.classList.remove(styles.draggedBefore);
            it.classList.remove(styles.draggedBefore);
            it.classList.remove(styles.draggeditem);
          }
        }
      };
    }
  }

  createEffect(() => {
    if (sorter && availableFeeds().length > 0) {
      sortList(sorter);
    }
  });

  return (
    <div id={props.id} class={styles.feedSorter} ref={sorter}>
      <Show when={availableFeeds().length > 0}>
        <For each={availableFeeds()}>
          {(feed, index) => (
            <div class={styles.feedItem} data-value={feed.hex} data-index={index()}>
              <Show
                when={editMode() === feed.hex}
                fallback={
                  <>
                    <Show when={account?.hasPublicKey()}>
                      <div class={styles.sortControls}>
                        <div class={styles.dragIcon}></div>
                      </div>
                      <div class={styles.manageControls}>
                        <button class={styles.mngButton} onClick={() => editFeed(feed)}>
                          <div class={styles.editButton}></div>
                        </button>
                        <button class={styles.mngButton} onClick={() => removeFeed(feed)}>
                          <div class={styles.deleteButton}></div>
                        </button>
                      </div>
                    </Show>
                    <div class={styles.feedName}>{feed.name}</div>
                  </>
                }
              >
                <div class={styles.feedEdit}>
                  <input
                    id={`input_${feed.hex}`}
                    class={styles.feedNameInput}
                    value={newName()}
                    // @ts-ignore
                    onInput={(e: InputEvent) => setNewName(() => e.target?.value)}
                    onKeyUp={(e: KeyboardEvent) => {
                      if (e.code === 'Enter') {
                        updateFeedName(feed);
                      }

                      if (e.code === 'Escape') {
                        setEditMode('');
                      }
                    }}
                  />
                  <div class={styles.feedEditControl}>
                    <button
                      onClick={() => updateFeedName(feed)}
                      title="Update"
                    >
                      <div class={styles.checkIcon}></div>
                    </button>
                    <button
                      onClick={() => {setEditMode('')}}
                      title="Cancel"
                    >
                      <div class={styles.closeIcon}></div>
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}

export default hookForDev(FeedSorter);
