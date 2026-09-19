import React, { useState } from 'react';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { UserPlus, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../../../hooks/useToast';

/**
 * AddMemberForm Component
 * Sends POST /api/v1/organizations/{org_id}/members
 * Schema strictly expects: user_id, role
 */
export default function AddMemberForm({ organizationId, onSuccess }) {
  const { addMember } = useOrganization();
  const toast = useToast();

  const [formData, setFormData] = useState({
    user_id: '',
    role: 'member',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [lastAdded, setLastAdded] = useState(null);

  const validate = () => {
    const errors = {};
    if (!formData.user_id.trim()) {
      errors.user_id = 'User ID is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organizationId) {
      setApiError('No active organization selected.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        user_id: formData.user_id.trim(),
        role: formData.role,
      };

      const response = await addMember(organizationId, payload);
      toast.success(`Member (${formData.role}) successfully assigned to organization.`);
      setLastAdded({
        user_id: formData.user_id.trim(),
        role: formData.role,
        timestamp: new Date().toLocaleTimeString(),
      });
      setFormData({ user_id: '', role: 'member' });
      if (onSuccess) onSuccess(response);
    } catch (err) {
      setApiError(err.message || 'Failed to add member to organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* API Level Error Notification */}
      {apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2.5 animate-in fade-in-50"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#DC2626]" />
          <div>
            <p className="font-semibold">Unable to Add Member</p>
            <p className="mt-0.5 text-[#B91C1C] leading-relaxed">{apiError}</p>
          </div>
        </div>
      )}

      {/* Success Confirmation State */}
      {lastAdded && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#16A34A]" />
          <div>
            <p className="font-semibold">Member Added Successfully</p>
            <p className="mt-0.5 text-[#15803D]">
              User ID <span className="font-mono font-medium">{lastAdded.user_id}</span> was granted <span className="font-semibold capitalize">{lastAdded.role}</span> permissions at {lastAdded.timestamp}.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="User ID"
          name="user_id"
          type="text"
          placeholder="e.g. usr_99812 or UUID"
          value={formData.user_id}
          onChange={handleChange}
          error={formErrors.user_id}
          helperText="Unique system identifier for the platform user"
          leftIcon={UserPlus}
          disabled={isSubmitting}
          required
        />

        <div>
          <label
            htmlFor="member-role"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            Workspace Role <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <select
              id="member-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full h-10.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] transition-all duration-150 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="member">Member — Standard catalog & pricing viewer</option>
              <option value="analyst">Analyst — Pricing recommendations & competitor editor</option>
              <option value="admin">Admin — Full workspace administrative access</option>
              <option value="viewer">Viewer — Read-only executive reports</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto text-xs sm:text-sm h-10 font-semibold"
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={UserPlus}
          >
            {isSubmitting ? 'Adding Member...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </div>
  );
}
