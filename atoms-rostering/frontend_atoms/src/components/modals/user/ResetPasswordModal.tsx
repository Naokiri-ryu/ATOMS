import React, { useState } from 'react';
import Modal from '../../common/Modal';
import Button from '../../ui/Button';
import Input from '../../common/Input';
import type { User } from '../../../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onReset: (userId: number, password?: string) => Promise<{ password: string }>;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onReset,
}) => {
  const [customPassword, setCustomPassword] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset local state when modal closes / user changes
  const handleClose = () => {
    setCustomPassword('');
    setResult(null);
    setError('');
    onClose();
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await onReset(user!.id, customPassword || undefined);
      setResult(res.password);
      setCustomPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" size="sm">
      <div className="space-y-4">
        {user && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">User:</span> {user.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Email:</span> {user.email}
            </p>
          </div>
        )}

        {!result ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Password (optional)
              </label>
              <Input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
              <p className="text-xs text-gray-500 mt-1">
                If left blank, a random temporary password will be generated.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                User will be required to change this password on their next login,
                and all existing sessions will be revoked.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReset}
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1 bg-navy-700 hover:bg-navy-800"
              >
                Reset Password
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Temporary password generated. Share it with the user securely.
              </p>
            </div>

            <div className="relative">
              <Input
                type="text"
                value={result}
                readOnly
                className="font-mono text-center tracking-wider"
              />
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 transition-colors"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;