# Local application tracker

Open **My applications** in the site navigation. The default view shows saved jobs and application lists. Choose **Add application** to open the editor, or Edit on an existing record. Cancel closes the editor without saving. Saved jobs have direct Apply links when their current listings load, status controls and Unsave. Missing listings retain available details without an unverified Apply link. Opening Apply never marks a job as applied.

Expand **Import saved jobs into applications**, then use **Add saved jobs to tracker** to create independent records from retained saved-job details. Repeated saved-job imports skip existing board identities. Legacy saved IDs without listing details cannot yet be imported.

Records belong to this site's browser profile on this device, not an account. People sharing a browser profile share the records. There is no backend syncing. Clearing site storage removes records. Notes, dates and links are excluded from site analytics.

## Backup and recovery

1. Expand **Backup and restore**, then choose **Download backup**. Store the JSON file privately; it contains links and notes in plain text.
2. In the destination browser, open **My applications**, expand **Backup and restore** and choose the backup file.
3. Review the new-record and duplicate counts plus the sample entries.
4. Choose **Import new records**, or cancel without changing storage.

Version 1 backups include application tracker records only, not the separate board saved-ID list, retained listing cache or analytics preferences. Effective board-linked statuses are captured at export. During import, existing tracker records win for matching application IDs or board job IDs. Existing board statuses take precedence when displaying imported board-linked records. Different manual IDs remain separate even if titles and companies match. Imports never replace existing records.

Import accepts at most 5 MB and 10,000 records. Unsupported formats, invalid records, repeated application IDs, unsafe links and invalid dates reject the entire file before storage changes. File processing happens locally. A quota or storage failure leaves the import available to retry. Browser storage limits still apply to the combined result.

This backup format can support future profile migration, but no profile or account service is implemented yet.
