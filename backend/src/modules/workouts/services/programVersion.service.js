/**
 * Program Versioning Service
 * Handles version management with activeVersionId pointer pattern
 */

const Program = require('../models/program.model');

class ProgramVersionService {
  /**
   * Create new version of a program
   * - Creates new document with incremented version
   * - Updates activeVersionId pointer on all related versions
   * - Marks previous version as not current
   * - Preserves history for rollback
   */
  async createNewVersion(programId, updates, versionNotes) {
    const currentProgram = await Program.findById(programId);
    if (!currentProgram) {
      throw new Error('Program not found');
    }

    // Get the root program ID (for version chains)
    const rootProgramId = currentProgram.parentProgramId || currentProgram._id;

    // Create new version
    const newVersion = new Program({
      ...currentProgram.toObject(),
      _id: undefined,
      ...updates,
      version: currentProgram.version + 1,
      parentProgramId: rootProgramId,
      versionNotes,
      isCurrentVersion: true,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await newVersion.save();

    // Update activeVersionId pointer on all versions in the chain
    await Program.updateMany(
      {
        $or: [
          { _id: rootProgramId },
          { parentProgramId: rootProgramId },
        ],
      },
      {
        $set: {
          activeVersionId: newVersion._id,
          isCurrentVersion: false,
        },
      }
    );

    // Mark new version as current
    newVersion.isCurrentVersion = true;
    newVersion.activeVersionId = newVersion._id;
    await newVersion.save();

    return newVersion;
  }

  /**
   * Rollback to a previous version
   * - Updates activeVersionId to point to selected version
   * - Marks selected version as current
   */
  async rollbackToVersion(versionId) {
    const targetVersion = await Program.findById(versionId);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    const rootProgramId = targetVersion.parentProgramId || targetVersion._id;

    // Update all versions in chain
    await Program.updateMany(
      {
        $or: [
          { _id: rootProgramId },
          { parentProgramId: rootProgramId },
        ],
      },
      {
        $set: {
          activeVersionId: versionId,
          isCurrentVersion: false,
        },
      }
    );

    // Mark target version as current
    targetVersion.isCurrentVersion = true;
    targetVersion.activeVersionId = versionId;
    await targetVersion.save();

    return targetVersion;
  }

  /**
   * Get all versions of a program
   */
  async getVersionHistory(programId) {
    const program = await Program.findById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const rootProgramId = program.parentProgramId || program._id;

    const versions = await Program.find({
      $or: [
        { _id: rootProgramId },
        { parentProgramId: rootProgramId },
      ],
    }).sort({ version: -1 });

    return versions;
  }

  /**
   * Get current active version
   */
  async getActiveVersion(programId) {
    const program = await Program.findById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    if (program.activeVersionId) {
      return await Program.findById(program.activeVersionId);
    }

    return program;
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1, versionId2) {
    const [version1, version2] = await Promise.all([
      Program.findById(versionId1),
      Program.findById(versionId2),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    // Return comparison object
    return {
      version1: {
        id: version1._id,
        version: version1.version,
        name: version1.name,
        workouts: version1.workouts.length,
        updatedAt: version1.updatedAt,
      },
      version2: {
        id: version2._id,
        version: version2.version,
        name: version2.name,
        workouts: version2.workouts.length,
        updatedAt: version2.updatedAt,
      },
      differences: {
        nameChanged: version1.name !== version2.name,
        workoutsChanged: version1.workouts.length !== version2.workouts.length,
        descriptionChanged: version1.description !== version2.description,
      },
    };
  }
}

module.exports = new ProgramVersionService();




