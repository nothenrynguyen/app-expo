# Local application tracker

Open **Applications** in the site navigation. The default view shows a table with Company, Location, an inline Status selector and Edit, plus status filters. Switch to **Saved jobs** to see your shortlist. Choose Edit to change fields, access dates and notes, or delete the record. Existing records without a location show Not set. Location is included in backups; legacy backups without it remain supported. Choose **Add application** to open the editor, or Edit on an existing record. Cancel closes the editor without saving. Saved jobs have direct Apply links when their current listings load, status controls and Unsave. Missing listings retain available details without an unverified Apply link. Opening Apply never marks a job as applied.

Expand **Manage records**, then use **Import saved jobs** to create independent records from retained saved-job details. Repeated saved-job imports skip existing board identities. Legacy saved IDs without listing details cannot yet be imported.

Records belong to this site's browser profile on this device, not an account. People sharing a browser profile share the records. There is no backend syncing. Clearing site storage removes records. Notes, dates and links are excluded from site analytics.

## Backup and recovery

Saved jobs also offer **Mark applied**. This creates a tracker record once, or updates the existing board-linked record, and keeps the job saved. Current listing location and link are included when available. The action does not invent an application date or overwrite existing notes. Opening an employer link alone never marks a job applied. Unknown locations remain unset. The application table shows company, position, location, a colored editable status and Edit; deletion is inside the editor.

1. Expand **Manage records**, then choose **Download backup**. Store the JSON file privately; it contains links and notes in plain text.
2. In the destination browser, open **Applications**, expand **Manage records** and choose the backup file.
3. Review the new-record and duplicate counts plus the sample entries.
4. Choose **Import new records**, or cancel without changing storage.

Version 1 backups include application tracker records only, not the separate board saved-ID list, retained listing cache or analytics preferences. Effective board-linked statuses are captured at export. During import, existing tracker records win for matching application IDs or board job IDs. Existing board statuses take precedence when displaying imported board-linked records. Different manual IDs remain separate even if titles and companies match. Imports never replace existing records.

Import accepts at most 5 MB and 10,000 records. Unsupported formats, invalid records, repeated application IDs, unsafe links and invalid dates reject the entire file before storage changes. File processing happens locally. A quota or storage failure leaves the import available to retry. Browser storage limits still apply to the combined result.

This backup format can support future profile migration, but no profile or account service is implemented yet.
