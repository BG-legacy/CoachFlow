# Data Retention Policy

**Effective Date**: December 20, 2025  
**Last Updated**: December 20, 2025  
**Version**: 1.0

## 1. Overview

This document defines the data retention and deletion policies for CoachFlow. These policies ensure compliance with data protection regulations (GDPR, CCPA) while balancing business needs and user rights.

## 2. General Principles

- **Minimal Retention**: Data is retained only as long as necessary for its intended purpose
- **User Control**: Users have the right to request deletion of their data
- **Automatic Cleanup**: Automated processes enforce retention policies
- **Secure Deletion**: Deleted data is permanently and securely erased
- **Audit Trail**: Retention and deletion actions are logged

## 3. Data Categories and Retention Periods

### 3.1 User Account Data

**Data Type**: Email, name, phone, role, preferences  
**Retention Period**: Duration of active account + 30 days after deletion request  
**Justification**: Core user identity; retained during grace period for account recovery

**Deletion Process**:
1. User requests account deletion
2. Account deactivated immediately
3. 30-day grace period begins
4. User notified of scheduled deletion date
5. After 30 days, account anonymized/deleted

**Implementation**:
```javascript
// User model fields
deletionRequestedAt: Date
deletionScheduledFor: Date (deletionRequestedAt + 30 days)
isDeleted: Boolean
deletedAt: Date
```

### 3.2 Video Content (Form Analysis)

**Data Type**: Exercise form analysis videos  
**Retention Period**: 90 days after analysis completion  
**Justification**: Users need time to review feedback; videos are storage-intensive

**Deletion Process**:
1. Video uploaded and analyzed
2. `retentionDate` set to analysisCompletedDate + 90 days
3. User notified 7 days before deletion
4. Video file and database record deleted after 90 days

**Implementation**:
```javascript
// FormAnalysis model
retentionDate: Date // Set when analysis completes
notificationSent: Boolean
```

**Storage Cost Optimization**:
- Videos > 30 days old: Move to cold storage (if using cloud)
- Videos > 90 days old: Permanent deletion

### 3.3 Session Notes & Messages

**Data Type**: Session notes, coach feedback, client messages  
**Retention Period**: Duration of coaching relationship + 1 year  
**Justification**: Historical reference, legal protection

**Deletion Process**:
1. Coaching relationship ends (client removes coach or account deleted)
2. Relationship end date recorded
3. Notes retained for 1 year
4. After 1 year, notes archived or deleted based on coach preference
5. When user account deleted, their session notes purged after 30 days

**Implementation**:
```javascript
// Session model
relationshipEndDate: Date
archiveAfter: Date (endDate + 1 year)
```

**Coach Retention**:
- Coaches may request to retain anonymized session data for their records
- Client PII must be removed from retained data

### 3.4 Health & Biometric Data

**Data Type**: Weight, body measurements, medical info, progress photos  
**Retention Period**: Duration of active account + 30 days  
**Justification**: Highly sensitive; deleted with account

**Deletion Process**:
1. User requests account deletion
2. Health data immediately marked for deletion
3. 30-day grace period (data not accessible but recoverable)
4. After 30 days, permanently deleted
5. Backup copies purged within 7 days of deletion

**Special Considerations**:
- Medical information (injuries, conditions, medications) deleted immediately
- Progress photos deleted from all storage locations
- Aggregate anonymized data may be retained for research (no PII)

**Implementation**:
```javascript
// ClientProfile model - delete entire record
// Checkin model - delete all records
// Medical info - immediate deletion, no grace period
```

### 3.5 Nutrition Logs

**Data Type**: Food logs, meal plans  
**Retention Period**: Duration of active account + 90 days  
**Justification**: Users may want historical nutrition data

**Deletion Process**:
1. User requests account deletion
2. Nutrition data retained during 30-day grace period
3. After grace period, retained for additional 60 days
4. Permanent deletion after 90 days total

**Export Option**:
- Users can export nutrition data before deletion
- CSV and JSON formats available

### 3.6 Authentication & Audit Logs

**Data Type**: Login attempts, password changes, admin actions, security events  
**Retention Period**: 2 years minimum  
**Justification**: Security incident investigation, compliance requirements

**Deletion Process**:
1. Logs stored in MongoDB audit collection
2. Rotated to cold storage after 6 months
3. Anonymized after 2 years (remove IP addresses, user agents)
4. Retained indefinitely in anonymized form for security analysis

**Log Types and Retention**:
| Log Type | Retention | Anonymization |
|----------|-----------|---------------|
| Login attempts | 2 years | After 2 years |
| Password changes | 2 years | After 2 years |
| Admin actions | 5 years | Never (legal requirement) |
| Security events | 2 years | After 1 year |
| Audit trail | 7 years | After 2 years |

**Implementation**:
```javascript
// AuditEvent model
archiveDate: Date (createdAt + 6 months)
anonymizeDate: Date (createdAt + 2 years)
```

### 3.7 Financial & Payment Data

**Data Type**: Session prices, payment status, invoices  
**Retention Period**: 7 years  
**Justification**: Tax and legal requirements (IRS, accounting standards)

**Deletion Process**:
1. User requests account deletion
2. Financial records separated from user account
3. PII anonymized but transaction records retained
4. After 7 years, records deleted

**Anonymization**:
```javascript
// Session model after user deletion
clientId: null
clientName: "[DELETED USER]"
// Payment data retained with transaction ID only
```

**Compliance**: IRS requires 7-year retention for business records

### 3.8 Backup Data

**Data Type**: Database backups, file backups  
**Retention Period**: 30 days for daily backups, 1 year for monthly backups  
**Justification**: Disaster recovery

**Deletion Process**:
1. Daily backups: Retained 30 days, then overwritten
2. Weekly backups: Retained 90 days
3. Monthly backups: Retained 1 year
4. When user deleted, flagged in backup metadata
5. Backups older than user deletion + grace period can be purged of that user's data

**Backup Encryption**: All backups encrypted at rest

## 4. User Rights & Data Export

### 4.1 Right to Access (GDPR Article 15)

Users can request a complete export of their data at any time.

**Process**:
1. User clicks "Export My Data" in account settings
2. System generates JSON file with all user data
3. File available for download immediately
4. Export includes: profile, sessions, check-ins, nutrition, videos (links)

**Implementation**: `GET /api/v1/auth/export-data`

### 4.2 Right to Erasure (GDPR Article 17)

Users can request deletion of their account and all associated data.

**Process**:
1. User clicks "Delete My Account" in account settings
2. Confirmation dialog explains 30-day grace period
3. Account immediately deactivated
4. User receives email with deletion date and cancellation link
5. After 30 days, permanent deletion

**Implementation**: `POST /api/v1/auth/delete-account`

### 4.3 Right to Rectification (GDPR Article 16)

Users can update their personal information at any time.

**Process**:
1. User edits profile information
2. Changes saved immediately
3. Audit log records the change

**Implementation**: Existing profile update endpoints

## 5. Automated Retention Enforcement

### 5.1 Scheduled Jobs

**Daily Jobs** (Run at 2:00 AM UTC):
```bash
# Delete expired videos
DELETE FROM form_analyses WHERE retentionDate < NOW() AND deleted = false

# Process scheduled account deletions
Run: accountDeletionService.processScheduledDeletions()

# Clean up old tokens
DELETE FROM token_blacklist WHERE expiresAt < NOW()
```

**Weekly Jobs** (Run Sunday 3:00 AM UTC):
```bash
# Archive old session notes
UPDATE sessions SET archived = true 
WHERE relationshipEndDate < DATE_SUB(NOW(), INTERVAL 1 YEAR)

# Send deletion reminders
Email users with deletionScheduledFor in next 7 days
```

**Monthly Jobs** (Run 1st of month 4:00 AM UTC):
```bash
# Rotate audit logs to cold storage
Archive audit_events older than 6 months

# Clean up old backups
Delete daily backups older than 30 days
Delete weekly backups older than 90 days
Delete monthly backups older than 1 year
```

**Yearly Jobs** (Run January 1st 5:00 AM UTC):
```bash
# Anonymize old audit logs
Anonymize audit_events older than 2 years

# Review retention policies
Generate report of data volumes and retention compliance
```

### 5.2 Cron Job Configuration

```bash
# /etc/cron.d/coachflow-retention

# Daily cleanup at 2 AM
0 2 * * * node /path/to/backend/scripts/daily-retention-cleanup.js

# Weekly cleanup at 3 AM on Sunday
0 3 * * 0 node /path/to/backend/scripts/weekly-retention-cleanup.js

# Monthly cleanup at 4 AM on the 1st
0 4 1 * * node /path/to/backend/scripts/monthly-retention-cleanup.js

# Yearly review at 5 AM on January 1st
0 5 1 1 * node /path/to/backend/scripts/yearly-retention-review.js
```

### 5.3 Job Implementation

See: `/backend/scripts/retention-jobs/` for implementation

## 6. Compliance Matrix

| Requirement | GDPR | CCPA | HIPAA | Implementation |
|------------|------|------|-------|----------------|
| Data minimization | ✅ | ✅ | ✅ | Only collect necessary data |
| Purpose limitation | ✅ | ✅ | ✅ | Data used only for stated purpose |
| Storage limitation | ✅ | ✅ | ✅ | This retention policy |
| Right to access | ✅ | ✅ | N/A | Data export feature |
| Right to erasure | ✅ | ✅ | N/A | Account deletion |
| Right to rectification | ✅ | ✅ | ✅ | Profile editing |
| Data portability | ✅ | N/A | N/A | JSON export |
| Audit trail | ✅ | ✅ | ✅ | Audit logging system |

## 7. Exceptions

### 7.1 Legal Hold

If user data is subject to legal proceedings, retention policies are suspended:
1. Legal team flags account with legal hold
2. Automated deletion disabled for that account
3. Data retained until legal hold released
4. Audit log records legal hold status

### 7.2 Fraud Investigation

If fraud is suspected:
1. Account flagged by admin
2. Extended retention (up to 5 years)
3. User notified of extended retention reason
4. Review after investigation concludes

### 7.3 Regulatory Compliance

Financial data retention cannot be overridden by user deletion requests (7-year requirement).

## 8. Data Breach Response

If data breach occurs:
1. Affected users notified within 72 hours
2. Retention policies may be adjusted
3. Additional audit logs created
4. Forensic data retained for investigation

## 9. Policy Review

This policy is reviewed:
- **Annually**: January review by legal and technical teams
- **After major updates**: When features change data handling
- **Regulatory changes**: When laws change (GDPR updates, etc.)

**Version History**:
- v1.0 (Dec 20, 2025): Initial policy

## 10. User Notification

Users are notified of data retention in the following ways:

1. **Privacy Policy**: Full details available
2. **Account Settings**: Retention periods displayed
3. **Before Deletion**: 7-day warning email
4. **Grace Period**: Email with cancellation link
5. **After Deletion**: Confirmation email

## 11. Contact & Questions

For questions about data retention:
- **Email**: privacy@coachflow.com
- **Data Protection Officer**: dpo@coachflow.com
- **Address**: [Company Address]

## 12. Implementation Checklist

- [x] User model soft delete fields added
- [x] Account deletion service implemented
- [x] Grace period mechanism created
- [ ] Scheduled jobs implemented
- [ ] Video retention automation
- [ ] Audit log anonymization script
- [ ] Backup purge process
- [ ] User notification emails
- [ ] Data export feature (implemented)
- [ ] Legal hold mechanism
- [ ] Policy display in UI

## Appendix A: Field-Level Retention

### User Fields
| Field | Retention | Deletion Method |
|-------|-----------|-----------------|
| email | 30 days | Anonymized to deleted_{userId}@deleted.local |
| password | 30 days | Set to null |
| firstName | 30 days | Set to [DELETED] |
| lastName | 30 days | Set to [DELETED] |
| phone | Immediate | Set to null |
| avatar | Immediate | File deleted, field set to null |
| consent | 7 years | Anonymized |

### Client Profile Fields
| Field | Retention | Deletion Method |
|-------|-----------|-----------------|
| personalInfo | 30 days | Record deleted |
| medicalInfo | Immediate | Record deleted |
| measurements | 30 days | Record deleted |
| photos | Immediate | Files deleted |

### Form Analysis Fields
| Field | Retention | Deletion Method |
|-------|-----------|-----------------|
| videoUrl | 90 days | File deleted, record removed |
| analysisResults | 90 days | Record deleted |

---

**END OF POLICY**

