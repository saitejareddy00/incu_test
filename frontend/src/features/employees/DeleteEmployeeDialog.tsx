import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useDeleteEmployee } from '../../api/hooks';
import { useNotify } from '../../notifications/NotifyContext';

interface Props {
  open: boolean;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}

export function DeleteEmployeeDialog({ open, employeeId, employeeName, onClose }: Props) {
  const notify = useNotify();
  const deleteMutation = useDeleteEmployee();

  async function handleConfirm() {
    try {
      await deleteMutation.mutateAsync(employeeId);
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Delete Employee"
      message={`Are you sure you want to delete ${employeeName}? This action cannot be undone.`}
      confirmLabel="Delete"
      confirmColor="error"
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
