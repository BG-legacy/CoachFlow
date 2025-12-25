# Data Privacy Audit - CoachFlow

**Audit Date**: December 20, 2025  
**Status**: 🟡 Partial Compliance - Implementation Required

## Executive Summary

This document audits the CoachFlow application against data privacy requirements (B3 checklist).

### Compliance Status

| Requirement | Status | Notes |
|------------|--------|-------|
| PII fields identified | ✅ Complete | Documented below |
| Data retention policy | ❌ Missing | Needs documentation & implementation |
| User consent fields | ❌ Missing | Needs implementation |
| Account deletion path | ⚠️ Partial | Only hard delete exists, no soft delete |
| Encryption (at-rest & TLS) | ✅ Complete | Provider-managed + TLS configured |

---

## 1. PII Fields Identification ✅

### User Model (`/modules/auth/models/user.model.js`)

**Personally Identifiable Information (PII):**
- ✅ `email` - Email address (unique identifier)
- ✅ `firstName` - First name
- ✅ `lastName` - Last name  
- ✅ `phone` - Phone number (optional)
- ✅ `avatar` - Profile picture URL

**Sensitive Fields:**
- ✅ `password` - Hashed password (select: false)
- ✅ `emailVerificationToken` - Temporary token (select: false)
- ✅ `passwordResetToken` - Temporary token (select: false)
- ✅ `lastLogin` - Activity tracking

**Metadata:**
- `role` - User role (client/coach/admin)
- `isActive` - Account status
- `isEmailVerified` - Verification status
- `preferences` - User preferences (timezone, language, notifications)
- `coachProfile` - Coach-specific data (bio, specializations, certifications)

### Client Profile Model (`/modules/clients/models/clientProfile.model.js`)

**Health & Biometric PII:**
- ✅ `personalInfo.dateOfBirth` - Date of birth
- ✅ `personalInfo.gender` - Gender identification
- ✅ `personalInfo.height` - Height in cm
- ✅ `personalInfo.weight` - Weight in kg
- ✅ `personalInfo.bodyFatPercentage` - Body composition

**Medical Information (HIGHLY SENSITIVE):**
- ✅ `medicalInfo.injuries` - Injury history
- ✅ `medicalInfo.conditions` - Medical conditions
- ✅ `medicalInfo.medications` - Medication list
- ✅ `medicalInfo.allergies` - Allergy information
- ✅ `medicalInfo.restrictions` - Medical restrictions
- ✅ `medicalInfo.notes` - Additional medical notes

**Fitness Data:**
- ✅ `measurements[]` - Body measurements over time (chest, waist, hips, biceps, thighs)
- ✅ `fitnessProfile` - Fitness goals and activity level

**Nutritional Preferences:**
- ✅ `nutritionPreferences.dietType` - Dietary restrictions
- ✅ `nutritionPreferences.restrictions` - Food restrictions/allergies
- ✅ `nutritionPreferences.dislikes` - Food dislikes

### Check-in Model (`/modules/checkins/models/checkin.model.js`)

**Health Tracking Data:**
- ✅ `metrics.weight` - Weight tracking
- ✅ `metrics.bodyFat` - Body fat tracking
- ✅ `metrics.mood` - Mental health indicator (1-10)
- ✅ `metrics.energy` - Energy level tracking
- ✅ `metrics.stress` - Stress level tracking
- ✅ `metrics.sleep` - Sleep hours and quality
- ✅ `metrics.measurements` - Body measurements
- ✅ `photos[]` - Progress photos (URLs)

**Performance Data:**
- ✅ `adherence` - Workout and nutrition adherence
- ✅ `progress.achievements` - Personal achievements
- ✅ `progress.challenges` - Personal challenges
- ✅ `coachFeedback` - Coach notes and recommendations

### Form Analysis Model (`/modules/formAnalysis/models/formAnalysis.model.js`)

**Video Data:**
- ✅ `videoUrl` - Exercise form video URL
- ✅ `videoFileName` - Original filename
- ✅ `analysisResults` - AI-generated analysis of user's form
- ✅ `metadata.duration` - Video duration

### Session Model (`/modules/sessions/models/session.model.js`)

**Booking & Communication Data:**
- ✅ `meetingLink` - Video call URL
- ✅ `location` - Physical meeting location
- ✅ `notes` - Session notes
- ✅ `coachNotes` - Coach's private notes
- ✅ `price` - Financial data
- ✅ `isPaid` - Payment status

### Nutrition Models (`/modules/nutrition/models/`)

**Dietary Data:**
- ✅ `foodLog` - Food consumption records
- ✅ `mealPlan` - Meal planning data

### Audit Trail (`TokenBlacklist` & Audit Logs)

**Activity Tracking:**
- ✅ `ipAddress` - User IP addresses
- ✅ `userAgent` - Browser/device information
- ✅ Audit logs store authentication events, changes, admin actions

---

## 2. Data Retention Policy ❌ MISSING

### Current State
**No formal data retention policies are documented or implemented.**

### Required Policies

#### 2.1 Video Data Retention
**Form Analysis Videos:**
- **Recommendation**: Retain for 90 days after analysis completion
- **Justification**: Allows users to review feedback, then purge for storage optimization
- **Action Required**: 
  - Add `retentionDate` field to `FormAnalysis` model
  - Create scheduled job to auto-delete expired videos
  - Notify users 7 days before deletion

#### 2.2 Message/Communication Data
**Session Notes & Coach Feedback:**
- **Recommendation**: Retain for duration of coaching relationship + 1 year
- **Justification**: Legal protection, historical reference
- **Action Required**:
  - Track relationship end date
  - Archive after 1 year post-termination
  - Allow user-initiated deletion after 30-day grace period

#### 2.3 Health & Biometric Data
**Medical Info & Measurements:**
- **Recommendation**: Retain while account active + 30 days after deletion request
- **Justification**: Allow account recovery, comply with regulations
- **Action Required**:
  - Implement soft delete with 30-day grace period
  - Permanently purge after grace period
  - Export data before purge

#### 2.4 Audit Logs
**Authentication & Activity Logs:**
- **Recommendation**: Retain for 2 years minimum
- **Justification**: Security incident investigation, compliance
- **Action Required**:
  - Implement log rotation
  - Archive old logs to cold storage
  - Anonymize after 2 years if possible

#### 2.5 Financial Data
**Session Payment Records:**
- **Recommendation**: Retain for 7 years
- **Justification**: Tax and legal requirements
- **Action Required**:
  - Separate financial records from user data
  - Archive, don't delete
  - Anonymize PII after retention period

### Implementation Checklist

```javascript
// Add to models that need retention policies:
{
  retentionDate: {
    type: Date,
    index: true, // For efficient cleanup queries
  },
  archivedAt: Date,
  archiveReason: String,
}
```

**Required Jobs:**
1. Daily: Check and purge expired videos
2. Weekly: Archive old session data
3. Monthly: Review and purge deleted accounts past grace period
4. Annually: Review and update retention policies

---

## 3. User Consent & Terms Acceptance ❌ MISSING

### Current State
**No consent tracking in User model.**

### Required Implementation

Add to `User` model:

```javascript
consent: {
  termsAcceptedAt: {
    type: Date,
    required: true, // Must accept terms to register
  },
  termsVersion: {
    type: String,
    default: '1.0',
  },
  privacyPolicyAcceptedAt: {
    type: Date,
    required: true,
  },
  privacyPolicyVersion: {
    type: String,
    default: '1.0',
  },
  marketingConsent: {
    type: Boolean,
    default: false,
  },
  marketingConsentDate: Date,
  dataProcessingConsent: {
    type: Boolean,
    default: true,
    required: true,
  },
  dataProcessingConsentDate: Date,
},
consentHistory: [{
  type: {
    type: String,
    enum: ['terms', 'privacy', 'marketing', 'data_processing'],
  },
  version: String,
  accepted: Boolean,
  timestamp: Date,
  ipAddress: String,
}],
```

### Registration Flow Updates

**Required Changes:**
1. Add consent checkboxes to registration form
2. Reject registration if terms/privacy not accepted
3. Log consent timestamp and IP address
4. Store version numbers for terms and privacy policy
5. Implement re-consent flow when policies update

**Validation:**
```javascript
// In registration endpoint
if (!userData.acceptedTerms || !userData.acceptedPrivacy) {
  throw new BadRequestError('You must accept Terms of Service and Privacy Policy');
}

user.consent = {
  termsAcceptedAt: new Date(),
  termsVersion: '1.0',
  privacyPolicyAcceptedAt: new Date(),
  privacyPolicyVersion: '1.0',
  dataProcessingConsent: true,
  dataProcessingConsentDate: new Date(),
};

user.consentHistory.push({
  type: 'terms',
  version: '1.0',
  accepted: true,
  timestamp: new Date(),
  ipAddress: req.ip,
});
```

---

## 4. Account Deletion Path ⚠️ PARTIAL

### Current State
**Only hard delete exists** - `User.findByIdAndDelete()` permanently removes data

### Issues with Current Implementation
1. ❌ No recovery period (immediate permanent deletion)
2. ❌ No data export before deletion
3. ❌ Related data (profiles, sessions) may become orphaned
4. ❌ No audit trail of deletion
5. ❌ No user notification

### Required: Soft Delete Implementation

#### 4.1 Add Soft Delete Fields

```javascript
// Add to User model
{
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  deletionRequestedAt: Date,
  deletionReason: String,
  deletionScheduledFor: Date, // deletionRequestedAt + 30 days
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}
```

#### 4.2 Soft Delete Process

**Phase 1: Request Deletion (Day 0)**
```javascript
async requestAccountDeletion(userId, reason) {
  const user = await User.findById(userId);
  
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30); // 30-day grace period
  
  await User.findByIdAndUpdate(userId, {
    deletionRequestedAt: new Date(),
    deletionScheduledFor: deletionDate,
    deletionReason: reason,
    isActive: false, // Immediately deactivate
  });
  
  // Send email: "Your account will be deleted on {date}"
  // Log audit event
  
  return {
    message: 'Account deletion scheduled',
    deletionDate,
    canCancelUntil: deletionDate,
  };
}
```

**Phase 2: Grace Period (Days 1-29)**
```javascript
async cancelAccountDeletion(userId) {
  await User.findByIdAndUpdate(userId, {
    deletionRequestedAt: null,
    deletionScheduledFor: null,
    deletionReason: null,
    isActive: true, // Reactivate
  });
  
  // Send email: "Account deletion cancelled"
  // Log audit event
  
  return { message: 'Account deletion cancelled' };
}
```

**Phase 3: Export Data (Day 25)**
```javascript
async exportUserData(userId) {
  const user = await User.findById(userId).select('-password');
  const profile = await ClientProfile.findOne({ userId });
  const checkins = await Checkin.find({ clientId: userId });
  const sessions = await Session.find({ clientId: userId });
  const formAnalyses = await FormAnalysis.find({ userId });
  
  return {
    user,
    profile,
    checkins,
    sessions,
    formAnalyses,
    exportDate: new Date(),
    format: 'JSON',
  };
}
```

**Phase 4: Hard Delete (Day 30)**
```javascript
async permanentlyDeleteAccount(userId) {
  // 1. Export data to archive (for legal compliance)
  const dataExport = await this.exportUserData(userId);
  await ArchiveService.store(userId, dataExport);
  
  // 2. Soft delete user (mark as deleted, don't purge yet)
  await User.findByIdAndUpdate(userId, {
    deletedAt: new Date(),
    isDeleted: true,
    // Anonymize PII
    email: `deleted_${userId}@deleted.com`,
    firstName: '[DELETED]',
    lastName: '[DELETED]',
    phone: null,
    avatar: null,
  });
  
  // 3. Delete or anonymize related data
  await ClientProfile.findOneAndDelete({ userId });
  await Checkin.updateMany(
    { clientId: userId },
    { $set: { clientDeleted: true } }
  );
  
  // 4. Delete videos and files
  const formAnalyses = await FormAnalysis.find({ userId });
  for (const analysis of formAnalyses) {
    await FileService.delete(analysis.videoUrl);
  }
  await FormAnalysis.deleteMany({ userId });
  
  // 5. Log audit event
  await AuditLogger.log({
    eventType: 'ACCOUNT_DELETED_PERMANENTLY',
    userId,
    details: { reason: 'User requested', scheduledDate: new Date() },
  });
  
  // 6. Send final email confirmation
  // Email sent to temporary secure mailbox
  
  return { message: 'Account permanently deleted' };
}
```

#### 4.3 Deletion Rules

**What Gets Deleted:**
- ✅ User account (anonymized)
- ✅ Client profile
- ✅ Form analysis videos
- ✅ Progress photos
- ✅ Personal measurements
- ✅ Medical information
- ✅ Nutrition logs

**What Gets Retained:**
- ⚠️ Audit logs (anonymized user ID only)
- ⚠️ Financial records (anonymized, 7-year retention)
- ⚠️ Aggregated analytics (no PII)
- ⚠️ Coach feedback (if coach needs to retain for their records)

**What Gets Transferred:**
- 🔄 Sessions with coaches (marked as "deleted client")
- 🔄 Payment history (anonymized)

#### 4.4 Query Modifications

**Filter deleted users from all queries:**

```javascript
// Add to User model
userSchema.pre(/^find/, function(next) {
  // Automatically exclude soft-deleted users
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Override when needed
User.findOne({ email }).setOptions({ includeDeleted: true });
```

---

## 5. Encryption ✅ COMPLETE

### 5.1 Data at Rest

**MongoDB Encryption:**
- ✅ Provider-managed encryption (MongoDB Atlas or equivalent)
- ✅ Database credentials stored in environment variables
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT secrets stored in environment variables

**File Storage:**
- ✅ Videos and images stored with unique hash filenames
- ⚠️ **Recommendation**: Enable encryption for S3 bucket (if using AWS)

```javascript
// Add to AWS S3 configuration
s3: {
  bucket: process.env.AWS_S3_BUCKET,
  serverSideEncryption: 'AES256', // ADD THIS
  sseKmsKeyId: process.env.AWS_KMS_KEY_ID, // For KMS encryption
}
```

### 5.2 Data in Transit

**TLS/HTTPS:**
- ✅ Configured via security headers (HSTS)
- ✅ Force HTTPS in production
- ✅ Certificate verification enabled

```javascript
// Already implemented in securityHeaders.js
helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})
```

**API Communication:**
- ✅ All API endpoints use HTTPS
- ✅ CORS configured with specific origins
- ✅ JWT tokens transmitted via Authorization header

### 5.3 Secrets Management

**Current Implementation:**
```bash
# .env file (NOT committed to git)
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
MONGODB_URI=<connection string with credentials>
AWS_ACCESS_KEY_ID=<aws key>
AWS_SECRET_ACCESS_KEY=<aws secret>
```

**✅ Good Practices:**
- Secrets in environment variables
- `.env` in `.gitignore`
- Script provided to generate secure secrets (`npm run secrets:generate`)

**Recommendations:**
- Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production
- Rotate secrets quarterly
- Use different secrets per environment

---

## Implementation Priority

### 🔴 Critical (Implement Immediately)

1. **Add consent fields to User model** - Legal requirement
2. **Implement soft delete** - Prevent accidental data loss
3. **Create data retention documentation** - Compliance requirement

### 🟡 High Priority (Implement within 30 days)

4. **Build "Delete My Account" user flow** - User right to deletion
5. **Implement automated data export** - GDPR requirement
6. **Create retention policy enforcement jobs** - Automated cleanup

### 🟢 Medium Priority (Implement within 90 days)

7. **Video retention automation** - Storage cost optimization
8. **Consent version tracking** - Policy updates
9. **Anonymization for old audit logs** - Privacy enhancement

---

## Testing Checklist

### Unit Tests Required

- [ ] Consent fields validation on registration
- [ ] Soft delete marks user as deleted
- [ ] Soft-deleted users excluded from queries
- [ ] Account deletion can be cancelled during grace period
- [ ] Hard delete after grace period removes all PII
- [ ] Data export contains all user data
- [ ] Retention policies enforced correctly

### Integration Tests Required

- [ ] User can request account deletion via API
- [ ] User receives email notification of deletion
- [ ] User can cancel deletion within grace period
- [ ] User can download data export
- [ ] Scheduled job purges accounts after grace period
- [ ] Related data (profiles, sessions) handled correctly

### Manual Tests Required

- [ ] Registration requires consent acceptance
- [ ] Terms version displayed to user
- [ ] Account deletion flow works end-to-end
- [ ] Data export file contains expected data
- [ ] Videos deleted when account deleted
- [ ] Coaches can't see deleted clients

---

## Compliance Checklist

### GDPR (if applicable)

- [ ] Right to access (data export) ✅ Need to implement
- [ ] Right to rectification (update profile) ✅ Already exists
- [ ] Right to erasure (delete account) ⚠️ Partial - need soft delete
- [ ] Right to data portability (export) ❌ Not implemented
- [ ] Right to object (marketing consent) ⚠️ Need consent fields
- [ ] Consent management ❌ Not implemented
- [ ] Data retention policies ❌ Not documented

### HIPAA (if handling PHI)

⚠️ **WARNING**: Current implementation may NOT be HIPAA compliant

Medical information is stored (`medicalInfo` in Client Profile):
- Injuries, conditions, medications, allergies

**Required for HIPAA:**
- [ ] Business Associate Agreements (BAA)
- [ ] Encrypted database (✅ provider-managed)
- [ ] Encrypted backups ❓ Check with provider
- [ ] Audit logging (✅ implemented)
- [ ] Access controls (✅ RBAC implemented)
- [ ] Breach notification procedures ❌ Not documented
- [ ] Regular risk assessments ❌ Not documented

**Recommendation**: Consult HIPAA compliance expert if handling medical data for US users.

---

## Next Steps

1. **Immediate**: Review this audit with legal/compliance team
2. **Week 1**: Implement consent fields and update registration
3. **Week 2**: Implement soft delete functionality
4. **Week 3**: Create data retention policy documentation
5. **Week 4**: Build user-facing "Delete Account" feature
6. **Month 2**: Implement automated retention enforcement
7. **Month 3**: Complete GDPR compliance (if applicable)
8. **Ongoing**: Quarterly privacy review and updates

---

## References

- [GDPR Official Text](https://gdpr.eu/)
- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [OWASP Privacy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Privacy_Cheat_Sheet.html)
- Internal: `backend/API_SECURITY.md`
- Internal: `backend/SECURITY_IMPLEMENTATION_SUMMARY.md`

---

**Document Version**: 1.0  
**Last Updated**: December 20, 2025  
**Next Review**: March 20, 2026

