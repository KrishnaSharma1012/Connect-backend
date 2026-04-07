import mongoose from "mongoose";
const BaseUser = require('./BaseUser');

const adminSchema = new mongoose.Schema({

  department: {
    type: String,
    default: 'General',
  },

  // Granular permissions — controls what admin can do
  // All true by default for standard admin
  permissions: {
    manageUsers:    { type: Boolean, default: true },
    // /admin/users — verify alumni, suspend, restore, delete
    manageCourses:  { type: Boolean, default: true },
    // /admin/courses — approve, reject, manage course listings
    manageSessions: { type: Boolean, default: true },
    // /admin/sessions — monitor upcoming live sessions
    viewAnalytics:  { type: Boolean, default: true },
    // /admin/analytics — revenue, retention, trends
    approveAlumni:  { type: Boolean, default: true },
    // Verify alumni accounts (the "✓ Verify" button in Users table)
  },

  // Super admin can create other admins and change permissions
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
});

const Admin = BaseUser.discriminator('admin', adminSchema);

export default Admin;