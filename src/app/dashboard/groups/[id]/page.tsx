'use client';

import type { IGroupItem } from 'src/types/group';

import { useState, useEffect } from 'react';

import { GroupService } from 'src/services/group';

import { GroupDetailsView } from 'src/sections/group/view';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<IGroupItem | null>(null);

  useEffect(() => {
    let mounted = true;
    GroupService.getById(params.id).then((data) => {
      if (mounted) setGroup(data);
    });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  return group ? <GroupDetailsView group={group} /> : null;
}
