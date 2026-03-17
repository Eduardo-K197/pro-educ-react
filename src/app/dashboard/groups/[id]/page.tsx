'use client';

import type { IGroupItem } from 'src/types/group';
import type { IAdminItem } from 'src/types/services/admin';

import { useState, useEffect } from 'react';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';

import { GroupDetailsView } from 'src/sections/group/view';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<IGroupItem | null>(null);
  const [allAdmins, setAllAdmins] = useState<IAdminItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {

        const [groupData, adminsResponse] = await Promise.all([
          GroupService.getById(params.id),
          AdminService.list()
        ])

        if (mounted) {
          setGroup(groupData);
          setAllAdmins(
            (adminsResponse.admins || []).map((admin) => ({
              id: admin.id,
              name: admin.name,
              email: admin.email,
              status: admin.status,
            }))
          );
        }
      } catch (error) {
        console.error("Eroo ao carregar os dados:", error);
      }
    };

    fetchData()

    // GroupService.getById(params.id).then((data) => {
    //   if (mounted) setGroup(data);
    // });

    return () => {
      mounted = false;
    };
  }, [params.id]);

  return group ? <GroupDetailsView group={group} adminList={allAdmins} /> : null;
}
