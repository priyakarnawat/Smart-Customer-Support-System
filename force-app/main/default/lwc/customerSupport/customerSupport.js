
import { LightningElement, track } from 'lwc';
import createComplaint from '@salesforce/apex/CustomerSupportController.createComplaint';
import getComplaints from '@salesforce/apex/CustomerSupportController.getComplaints';
import updateComplaintStatus from '@salesforce/apex/CustomerSupportController.updateComplaintStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CustomerSupport extends LightningElement {
    customerName = '';
    customerEmail = '';
    subject = '';
    description = '';
    category = '';
    priority = 'Medium';
    searchKey = '';
    selectedStatus = 'All';
    successMessage = '';

    @track complaints = [];

    categoryOptions = [
        { label: 'Technical Issue', value: 'Technical Issue' },
        { label: 'Billing', value: 'Billing' },
        { label: 'Product Complaint', value: 'Product Complaint' },
        { label: 'Service Issue', value: 'Service Issue' },
        { label: 'Other', value: 'Other' }
    ];

    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'New', value: 'New' },
        { label: 'Working', value: 'Working' },
        { label: 'Escalated', value: 'Escalated' },
        { label: 'Closed', value: 'Closed' }
    ];

    columns = [
        { label: 'Case Number', fieldName: 'CaseNumber' },
        { label: 'Customer', fieldName: 'SuppliedName' },
        { label: 'Subject', fieldName: 'Subject' },
        { label: 'Category', fieldName: 'Complaint_Category__c' },
        { label: 'Priority', fieldName: 'Priority' },
        { label: 'Status', fieldName: 'Status' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Mark Working', name: 'working' },
                    { label: 'Escalate', name: 'escalate' },
                    { label: 'Close', name: 'close' }
                ]
            }
        }
    ];

    connectedCallback() {
        this.loadComplaints();
    }

    async loadComplaints() {
        try {
            this.complaints = await getComplaints();
        } catch (error) {
            this.showToast('Error', this.getErrorMessage(error), 'error');
        }
    }

    get filteredComplaints() {
        return this.complaints.filter(item => {
            const search = this.searchKey.toLowerCase();
            const matchesSearch =
                (item.Subject || '').toLowerCase().includes(search) ||
                (item.CaseNumber || '').toLowerCase().includes(search) ||
                (item.SuppliedName || '').toLowerCase().includes(search);

            const matchesStatus =
                this.selectedStatus === 'All' ||
                item.Status === this.selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    handleNameChange(event) {
        this.customerName = event.target.value;
    }

    handleEmailChange(event) {
        this.customerEmail = event.target.value;
    }

    handleSubjectChange(event) {
        this.subject = event.target.value;
    }

    handleDescriptionChange(event) {
        this.description = event.target.value;
    }

    handleCategoryChange(event) {
        this.category = event.detail.value;
    }

    handlePriorityChange(event) {
        this.priority = event.detail.value;
    }

    handleSearch(event) {
        this.searchKey = event.target.value;
    }

    handleStatusFilter(event) {
        this.selectedStatus = event.detail.value;
    }

    async handleSubmit() {
        if (!this.customerName || !this.customerEmail ||
            !this.subject || !this.description ||
            !this.category || !this.priority) {
            this.showToast('Missing Information', 'Please complete all fields.', 'warning');
            return;
        }

        try {
            await createComplaint({
                customerName: this.customerName,
                customerEmail: this.customerEmail,
                subject: this.subject,
                description: this.description,
                category: this.category,
                priority: this.priority
            });

            this.showToast('Success', 'Complaint registered successfully!', 'success');

            this.customerName = '';
            this.customerEmail = '';
            this.subject = '';
            this.description = '';
            this.category = '';
            this.priority = 'Medium';

            this.template.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox')
                .forEach(field => field.value = '');

            await this.loadComplaints();
        } catch (error) {
            this.showToast('Error', this.getErrorMessage(error), 'error');
        }
    }

    async handleRowAction(event) {
        const action = event.detail.action.name;
        const caseId = event.detail.row.Id;

        const statusMap = {
            working: 'Working',
            escalate: 'Escalated',
            close: 'Closed'
        };

        try {
            await updateComplaintStatus({
                caseId: caseId,
                newStatus: statusMap[action]
            });

            this.showToast('Success', 'Complaint status updated.', 'success');
            await this.loadComplaints();
        } catch (error) {
            this.showToast('Error', this.getErrorMessage(error), 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    getErrorMessage(error) {
        return error?.body?.message || error?.message || 'Something went wrong.';
    }
}