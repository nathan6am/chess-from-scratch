import useAuth from "@/hooks/queries/useAuth";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";

import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { useState } from "react";
import EditProfileForm from "@/components/forms/EditProfileForm";
import { PanelHeader } from "@/components/base/Typography";
import { Button } from "@/components/base";
import { MdAccountCircle } from "react-icons/md";
import Link from "next/link";
export default function AccountPanel() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user, profile, updateProfile } = useAuth();
  const isGuest = user?.type === "guest";
  const username = user?.username;
  const hasCredentials = profile?.hasCredentials;
  return (
    <div>
      <PanelHeader className="mb-4">
        <MdAccountCircle className="inline mr-2" />
        Account Settings
      </PanelHeader>
      {user?.type === "guest" && (
        <div className="w-full max-w-lg py-8">
          <p
            className="italic text-light-400 w-full text-left
      "
          >
            <Link href="/login" className="underline hover:text-light-300">
              Login
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline hover:text-light-300">
              make an account
            </Link>{" "}
            to view and edit your account settings.
          </p>
        </div>
      )}
      {profile?.profile && (
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          title="Close your account?"
          message="Your account and any associated data will be deleted permanently. This cannot be undone"
          passphrase={user?.username || ""}
          passphraseMessage={`Type your username "${username}" to confirm this action.`}
          confirmText="Close Account"
          cancelText="Cancel"
          closeModal={() => setShowDeleteDialog(false)}
          onCancel={() => {
            setShowDeleteDialog(false);
          }}
          onConfirm={() => {}}
        />
      )}
      {profile?.profile && (
        <EditProfileForm
          currentProfile={{
            bio: profile.profile.bio,
            country: profile.profile.country,
            name: profile.name,
            username: profile.username,
          }}
        />
      )}
      {hasCredentials && <ChangePasswordForm />}
      {profile?.profile && (
        <>
          <PanelHeader className="text-lg">Close Account</PanelHeader>
          <p className="text-light-200 mb-4">Permanently delete your account</p>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full"
            label="Close Account"
            variant="danger"
          ></Button>
        </>
      )}
    </div>
  );
}
