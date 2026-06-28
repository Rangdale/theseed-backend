exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'varchar(128)',
      primaryKey: true,
      // Firebase UID — e.g. "abc123xyz"
      // varchar not uuid because Firebase UIDs are strings, not UUID format
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    display_name: {
      type: 'varchar(255)',
      notNull: false
    },
    profile_bio: {
      type: 'text',
      notNull: false
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};