
public with sharing class CustomerSupportController {

    @AuraEnabled
    public static Id createComplaint(
        String customerName,
        String customerEmail,
        String subject,
        String description,
        String category,
        String priority
    ) {
        try {
            Case c = new Case();
            c.SuppliedName = customerName;
            c.SuppliedEmail = customerEmail;
            c.Subject = subject;
            c.Description = description;
            c.Complaint_Category__c = category;
            c.Priority = priority;
            c.Status = 'New';
            c.Origin = 'Web';

            insert c;
            return c.Id;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getComplaints() {
        return [
            SELECT Id, CaseNumber, SuppliedName,
                   SuppliedEmail, Subject, Description,
                   Complaint_Category__c, Priority,
                   Status, CreatedDate
            FROM Case
            ORDER BY CreatedDate DESC
            LIMIT 500
        ];
    }

    @AuraEnabled
    public static void updateComplaintStatus(
        Id caseId,
        String newStatus
    ) {
        if (!FeatureManagement.checkPermission('Manage_Complaint_Status')) {
            throw new AuraHandledException(
                'You are not authorized to update complaint status.'
            );
        }

        try {
            Case c = new Case(
                Id = caseId,
                Status = newStatus
            );
            update c;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
