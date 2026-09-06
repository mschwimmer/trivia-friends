'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './auth-provider';

const ME_QUERY = gql`
  query Me {
    me {
      id
      displayName
    }
  }
`;

const UPDATE_DISPLAY_NAME_MUTATION = gql`
  mutation UpdateDisplayName($displayName: String!) {
    updateDisplayName(displayName: $displayName) {
      id
      displayName
    }
  }
`;

type MeData = {
  me: { id: string; displayName: string | null } | null;
};

type UpdateDisplayNameData = {
  updateDisplayName: { id: string; displayName: string };
};

export function AccountPanel() {
  const {
    user,
    loading: authLoading,
    error: authError,
    signInWithGoogle,
    signOutUser,
  } = useAuth();
  const {
    data,
    loading: profileLoading,
    error: profileError,
  } = useQuery<MeData>(ME_QUERY, { skip: !user });
  const [updateDisplayName, { loading: saving, error: saveError }] =
    useMutation<UpdateDisplayNameData>(UPDATE_DISPLAY_NAME_MUTATION);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);

  if (authLoading) {
    return <p className="account-loading">Checking your sign-in status…</p>;
  }

  if (!user) {
    return (
      <div className="account-actions">
        <button className="button" type="button" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
        {authError ? <p className="form-error">{authError}</p> : null}
      </div>
    );
  }

  async function submitDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedDisplayName = displayName.trim();

    if (normalizedDisplayName.length < 1 || normalizedDisplayName.length > 50) {
      return;
    }

    await updateDisplayName({
      variables: { displayName: normalizedDisplayName },
      update(cache, { data: mutationData }) {
        if (mutationData?.updateDisplayName) {
          cache.writeQuery<MeData>({
            query: ME_QUERY,
            data: { me: mutationData.updateDisplayName },
          });
        }
      },
    });
    setDisplayName(normalizedDisplayName);
    setEditing(false);
  }

  const hasDisplayName = Boolean(data?.me?.displayName);
  const showDisplayNameForm = !profileLoading && (!hasDisplayName || editing);

  return (
    <section className="account-panel" aria-labelledby="account-heading">
      <div className="account-summary">
        <div>
          <p className="eyebrow" id="account-heading">
            Signed in
          </p>
          <strong>
            {data?.me?.displayName ?? user.email ?? 'Google user'}
          </strong>
          {data?.me?.displayName && user.email ? (
            <span>{user.email}</span>
          ) : null}
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={signOutUser}
        >
          Sign out
        </button>
      </div>

      {profileLoading ? (
        <p className="account-loading">Loading your profile…</p>
      ) : null}
      {profileError ? (
        <p className="form-error">Could not load your profile.</p>
      ) : null}
      {authError ? <p className="form-error">{authError}</p> : null}

      {showDisplayNameForm ? (
        <form className="display-name-form" onSubmit={submitDisplayName}>
          <label htmlFor="display-name">
            {hasDisplayName ? 'Edit display name' : 'Choose a display name'}
          </label>
          <div className="form-row">
            <input
              id="display-name"
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={1}
              maxLength={50}
              required
            />
            <button className="button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {hasDisplayName ? (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  setDisplayName(data?.me?.displayName ?? '');
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
          {saveError ? (
            <p className="form-error">Could not save your display name.</p>
          ) : null}
        </form>
      ) : null}

      {!profileLoading && hasDisplayName && !editing ? (
        <div className="account-links">
          <Link className="button" href="/boards">
            My boards
          </Link>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setDisplayName(data?.me?.displayName ?? '');
              setEditing(true);
            }}
          >
            Edit display name
          </button>
        </div>
      ) : null}
    </section>
  );
}
