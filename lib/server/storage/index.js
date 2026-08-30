// ============================================================================
// Storage adapter selection.
//
// The API routes and UI only ever talk to this interface, so moving from the
// local filesystem to a hosted database + object store is an adapter swap, not
// a rewrite.
//
// Adapter contract:
//   listPatients()                                  -> [summary]
//   getPatient(id)                                  -> record | null
//   savePatient({ patientId, intake })              -> { id, savedAt, updatedAt }
//   deletePatient(id)                               -> void
//   listDocuments(id)                               -> [meta]
//   addDocument({ patientId, category, name, type, bytes }) -> meta
//   getDocument({ patientId, docId })               -> { meta, bytes } | null
//   deleteDocument({ patientId, docId })            -> boolean
// ============================================================================

import { fsAdapter } from './fsAdapter';

export function getStorage() {
  switch (process.env.SPINE_STORAGE_ADAPTER || 'filesystem') {
    case 'filesystem':
      return fsAdapter;
    default:
      throw new Error(
        `Unknown SPINE_STORAGE_ADAPTER "${process.env.SPINE_STORAGE_ADAPTER}". Only "filesystem" is implemented.`
      );
  }
}
